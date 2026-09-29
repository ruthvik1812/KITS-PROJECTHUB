import { db } from '../db/database.js';
import { formatProjectRecord } from './projectSqlService.js';

export interface GroupMemberInput {
  fullName: string;
  studentRollNumber: string;
  role?: string;
}

export interface CreateGroupDTO {
  leaderId: string;
  name: string;
  departmentId: string;
  academicYear: string;
  members?: GroupMemberInput[];
}

export function createOfficialGroup(dto: CreateGroupDTO) {
  // Check if leader already belongs to an official group
  const existingLeaderMembership = db.prepare(`
    SELECT m.*, g.name as group_name 
    FROM official_group_members m 
    JOIN official_groups g ON m.group_id = g.id
    WHERE m.user_id = ?
  `).get(dto.leaderId) as any;

  if (existingLeaderMembership) {
    throw new Error(`Leader already belongs to group "${existingLeaderMembership.group_name}". Under KITS policy, each student can only belong to one official submission group.`);
  }

  let leaderUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(dto.leaderId) as any;
  if (!leaderUser) {
    // If not found by ID, create a baseline user profile
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, email, full_name, role, department_id, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, 'student', ?, 1, ?, ?)
    `).run(dto.leaderId, `${dto.leaderId}@kitsts.ac.in`, 'Team Leader', dto.departmentId, now, now);
    leaderUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(dto.leaderId) as any;
  }

  // Validate member list if provided
  const membersInput = dto.members || [];
  const totalCount = 1 + membersInput.length; // leader + members

  if (membersInput.length > 0) {
    if (totalCount < 4 || totalCount > 6) {
      throw new Error(`Group policy check failed: Each group must contain 4 to 6 confirmed students. Current total (leader + members): ${totalCount}.`);
    }

    // Check internal duplicate roll numbers
    const rollSet = new Set<string>();
    if (leaderUser.student_roll_number) {
      rollSet.add(leaderUser.student_roll_number.toUpperCase());
    }

    for (const mem of membersInput) {
      const cleanRoll = mem.studentRollNumber.trim().toUpperCase();
      if (rollSet.has(cleanRoll)) {
        throw new Error(`Duplicate student roll number "${cleanRoll}" found in member list. Each student can only be registered once.`);
      }
      rollSet.add(cleanRoll);

      // Check external duplicate: Is this student already in another group?
      const existingEnrollment = db.prepare(`
        SELECT m.*, g.name as group_name 
        FROM official_group_members m 
        JOIN official_groups g ON m.group_id = g.id
        WHERE UPPER(m.student_roll_number) = ?
      `).get(cleanRoll) as any;

      if (existingEnrollment) {
        throw new Error(`Student ${cleanRoll} (${mem.fullName}) already belongs to submission group "${existingEnrollment.group_name}". Under KITS policy, each student can only belong to one official group.`);
      }
    }
  }

  const groupId = `grp-${Date.now()}`;
  const now = new Date().toISOString();
  const initialStatus = totalCount >= 4 && totalCount <= 6 ? 'confirmed' : 'forming';

  const insertGroup = db.prepare(`
    INSERT INTO official_groups (id, name, leader_id, department_id, academic_year, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMember = db.prepare(`
    INSERT INTO official_group_members (id, group_id, user_id, student_roll_number, invite_status, joined_at, created_at)
    VALUES (?, ?, ?, ?, 'accepted', ?, ?)
  `);

  // Atomic transaction
  const execute = db.transaction(() => {
    insertGroup.run(groupId, dto.name, dto.leaderId, dto.departmentId, dto.academicYear, initialStatus, now, now);

    // 1. Insert leader
    insertMember.run(
      `mem-lead-${Date.now()}`,
      groupId,
      dto.leaderId,
      leaderUser.student_roll_number || 'LEADER-ROLL',
      now,
      now
    );

    // 2. Insert members
    for (let i = 0; i < membersInput.length; i++) {
      const mem = membersInput[i];
      const cleanRoll = mem.studentRollNumber.trim().toUpperCase();

      // Find or create user
      let user = db.prepare(`SELECT * FROM users WHERE UPPER(student_roll_number) = ?`).get(cleanRoll) as any;
      if (!user) {
        const newUserId = `usr-${cleanRoll.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        db.prepare(`
          INSERT INTO users (id, email, full_name, role, department_id, student_roll_number, is_verified, created_at, updated_at)
          VALUES (?, ?, ?, 'student', ?, ?, 1, ?, ?)
        `).run(
          newUserId,
          `${cleanRoll.toLowerCase()}@kitsts.ac.in`,
          mem.fullName.trim(),
          dto.departmentId,
          cleanRoll,
          now,
          now
        );
        user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(newUserId) as any;
      }

      insertMember.run(
        `mem-${Date.now()}-${i}`,
        groupId,
        user.id,
        cleanRoll,
        now,
        now
      );
    }
  });

  execute();
  return getGroupById(groupId);
}

export function inviteMemberToGroup(groupId: string, leaderId: string, studentRollNumber: string) {
  const group = db.prepare(`SELECT * FROM official_groups WHERE id = ?`).get(groupId) as any;
  if (!group) throw new Error('Group not found.');
  if (group.leader_id !== leaderId) throw new Error('Only the team leader can invite members.');

  // Count existing members
  const memberCount = (db.prepare(`
    SELECT COUNT(*) as count FROM official_group_members WHERE group_id = ?
  `).get(groupId) as any).count;

  if (memberCount >= 6) {
    throw new Error('Group size limit reached. Maximum allowed members is 6 students.');
  }

  const cleanRoll = studentRollNumber.trim().toUpperCase();

  // Check if student already in any official group
  const existingMembership = db.prepare(`
    SELECT m.*, g.name as group_name 
    FROM official_group_members m 
    JOIN official_groups g ON m.group_id = g.id
    WHERE UPPER(m.student_roll_number) = ?
  `).get(cleanRoll) as any;

  if (existingMembership) {
    throw new Error(`Student ${cleanRoll} is already enrolled in official group "${existingMembership.group_name}".`);
  }

  // Find or create user
  let student = db.prepare(`SELECT * FROM users WHERE UPPER(student_roll_number) = ?`).get(cleanRoll) as any;
  const now = new Date().toISOString();

  if (!student) {
    const newUserId = `usr-${cleanRoll.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    db.prepare(`
      INSERT INTO users (id, email, full_name, role, department_id, student_roll_number, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, 'student', ?, ?, 1, ?, ?)
    `).run(newUserId, `${cleanRoll.toLowerCase()}@kitsts.ac.in`, `Student (${cleanRoll})`, group.department_id, cleanRoll, now, now);
    student = db.prepare(`SELECT * FROM users WHERE id = ?`).get(newUserId) as any;
  }

  const memberId = `mem-${Date.now()}`;
  db.prepare(`
    INSERT INTO official_group_members (id, group_id, user_id, student_roll_number, invite_status, joined_at, created_at)
    VALUES (?, ?, ?, ?, 'pending', NULL, ?)
  `).run(memberId, groupId, student.id, cleanRoll, now);

  return getGroupById(groupId);
}

export function acceptGroupInvitation(groupId: string, userId: string) {
  const member = db.prepare(`
    SELECT * FROM official_group_members WHERE group_id = ? AND user_id = ?
  `).get(groupId, userId) as any;

  if (!member) throw new Error('No invitation found for this user in this group.');
  if (member.invite_status === 'accepted') return getGroupById(groupId);

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE official_group_members SET invite_status = 'accepted', joined_at = ? WHERE id = ?
  `).run(now, member.id);

  const acceptedCount = (db.prepare(`
    SELECT COUNT(*) as count FROM official_group_members WHERE group_id = ? AND invite_status = 'accepted'
  `).get(groupId) as any).count;

  if (acceptedCount >= 4 && acceptedCount <= 6) {
    db.prepare(`UPDATE official_groups SET status = 'confirmed', updated_at = ? WHERE id = ?`).run(now, groupId);
  }

  return getGroupById(groupId);
}

export function declineGroupInvitation(groupId: string, userId: string) {
  const member = db.prepare(
    `SELECT * FROM official_group_members WHERE group_id = ? AND user_id = ?`
  ).get(groupId, userId) as any;

  if (!member) throw new Error('No invitation found.');
  if (member.invite_status === 'accepted') throw new Error('Cannot decline an already-accepted invitation.');

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE official_group_members SET invite_status = 'rejected', joined_at = NULL WHERE id = ?`
  ).run(member.id);

  return { message: 'Invitation declined.' };
}

export function getPendingInvitesByUserId(userId: string) {
  const rows = db.prepare(`
    SELECT m.*, g.name as group_name, g.academic_year,
           u.full_name as leader_name
    FROM official_group_members m
    JOIN official_groups g ON m.group_id = g.id
    JOIN users u ON g.leader_id = u.id
    WHERE m.user_id = ? AND m.invite_status = 'pending'
  `).all(userId) as any[];
  return rows;
}

export function getGroupById(groupId: string) {
  const group = db.prepare(`SELECT * FROM official_groups WHERE id = ?`).get(groupId) as any;
  if (!group) return null;

  const members = db.prepare(`
    SELECT m.*, u.full_name, u.email, u.department_id, u.role
    FROM official_group_members m
    JOIN users u ON m.user_id = u.id
    WHERE m.group_id = ?
  `).all(groupId);

  const confirmedCount = members.filter((m: any) => m.invite_status === 'accepted').length;

  // Attached shared project if uploaded
  const projectRow = db.prepare(`SELECT * FROM projects WHERE official_group_id = ?`).get(groupId);
  const project = projectRow ? formatProjectRecord(projectRow) : null;

  return {
    ...group,
    members,
    confirmedCount,
    isEligibleToSubmit: confirmedCount >= 4 && confirmedCount <= 6,
    project
  };
}

export function getGroupByUserId(userId: string, rollNumber?: string) {
  // Check as confirmed member by user ID
  let member = db.prepare(`
    SELECT group_id FROM official_group_members
    WHERE user_id = ? AND invite_status = 'accepted'
  `).get(userId) as any;

  // Check by leader_id (leaders are always confirmed)
  if (!member) {
    const asLeader = db.prepare(`
      SELECT id as group_id FROM official_groups WHERE leader_id = ?
    `).get(userId) as any;
    if (asLeader) member = asLeader;
  }

  // Check by roll number (confirmed members only)
  if (!member && rollNumber) {
    const cleanRoll = rollNumber.trim().toUpperCase();
    const byRoll = db.prepare(`
      SELECT group_id FROM official_group_members
      WHERE student_roll_number = ? AND invite_status = 'accepted'
    `).get(cleanRoll) as any;
    if (byRoll) member = byRoll;
  }

  if (!member) return null;
  return getGroupById(member.group_id);
}
