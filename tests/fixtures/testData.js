// =================================================================
// TEST FIXTURES - SAMPLE DATA FOR TESTS
// =================================================================

export const users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password: 'hashed_password',
    full_name: 'Admin User',
    role_id: 1,
    subscription_id: 3,
    is_active: true,
    is_email_verified: true
  },
  {
    id: 2,
    username: 'testuser',
    email: 'user@example.com',
    password: 'hashed_password',
    full_name: 'Test User',
    role_id: 3,
    subscription_id: 1,
    is_active: true,
    is_email_verified: true
  }
];

export const roles = [
  { id: 1, name: 'Owner' },
  { id: 2, name: 'Admin' },
  { id: 3, name: 'User' }
];

export const subscriptions = [
  {
    id: 1,
    name: 'Free',
    is_free: true,
    max_invitations: 1,
    can_remove_branding: false
  },
  {
    id: 2,
    name: 'Basic',
    is_free: false,
    max_invitations: 10,
    can_remove_branding: false
  },
  {
    id: 3,
    name: 'Premium',
    is_free: false,
    max_invitations: -1,
    can_remove_branding: true
  }
];

export const templates = [
  {
    id: 1,
    nama_template: 'Classic Wedding',
    category_id: 1,
    is_premium: false,
    img_thumbnail: '/uploads/templates/classic-thumb.jpg'
  },
  {
    id: 2,
    nama_template: 'Modern Elegant',
    category_id: 1,
    is_premium: true,
    img_thumbnail: '/uploads/templates/modern-thumb.jpg'
  }
];

export const projects = [
  {
    id: 1,
    user_id: 2,
    template_id: 1,
    nama_project: 'Wedding John & Jane',
    data: {
      groom: 'John Doe',
      bride: 'Jane Smith',
      date: '2026-06-15'
    }
  }
];

export const invitations = [
  {
    id: 1,
    project_id: 1,
    user_id: 2,
    unique_code: 'ABC123',
    status: 'active',
    view_count: 0
  }
];

export default {
  users,
  roles,
  subscriptions,
  templates,
  projects,
  invitations
};
