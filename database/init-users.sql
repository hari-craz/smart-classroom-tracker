-- Initial users for Smart Classroom Tracker
-- Default admin password: admin123
-- Default staff password: pass123

INSERT INTO users (username, email, password_hash, role, is_active) VALUES
('admin', 'admin@classroom.local', 'scrypt:32768:8:1$V2LhS488Nxx5Tik5$ce6e905d1d081233ea8a0f99b4aa86514e68ed8c953fa15bfc719b89dc6be9e39b251ffdef9a21476b86771ddb388f750e7036241c09ead36a329391ee9e92e2', 'admin', true),
('staff', 'staff@classroom.local', 'scrypt:32768:8:1$qDjTogwOFWhxsT1f$87575604872e7a0aae5728f006208feec53c847125cf71054e992be78b2f5772b6b91336dcc2028cf70ab358e120f1c103ec6fe652c9470ada38aa805f40fe1b', 'staff', true)
ON CONFLICT (username) DO NOTHING;
