import db from '../config/db';
export interface WieUser {
  id: string;
  email?: string;
  contact_no?: string;
  password: string;
  name: string;
  profile_picture?: string;
  role: string;
  is_blocked: boolean;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email?: string;
  contact_no?: string;
  password: string;
  name: string;
  profile_picture?: string;
}

class WieUserModel {
  async create(userData: CreateUserInput): Promise<WieUser> {
    const query = `
      INSERT INTO wie_users (email, contact_no, password, name, profile_picture)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      userData.email || null,
      userData.contact_no || null,
      userData.password,
      userData.name,
      userData.profile_picture || null,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  async findByEmail(email: string): Promise<WieUser | null> {
    const query = 'SELECT * FROM wie_users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }

  async findByContactNo(contact_no: string): Promise<WieUser | null> {
    const query = 'SELECT * FROM wie_users WHERE contact_no = $1';
    const result = await db.query(query, [contact_no]);
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<WieUser | null> {
    const query = 'SELECT * FROM wie_users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByEmailOrContactNo(identifier: string): Promise<WieUser | null> {
    const query = 'SELECT * FROM wie_users WHERE email = $1 OR contact_no = $1';
    const result = await db.query(query, [identifier]);
    return result.rows[0] || null;
  }

  async updateVerificationStatus(id: string, isVerified: boolean): Promise<void> {
    const query = `
      UPDATE wie_users 
      SET is_verified = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `;
    await db.query(query, [isVerified, id]);
  }

  async updateProfile(id: string, updates: Partial<WieUser>): Promise<WieUser> {
    const allowedFields = ['name', 'profile_picture', 'email', 'contact_no'];
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE wie_users 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  async deleteUser(id: string): Promise<void> {
    const query = 'DELETE FROM wie_users WHERE id = $1';
    await db.query(query, [id]);
  }
}

export default new WieUserModel();