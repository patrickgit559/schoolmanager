# TODO: Replace MongoDB with Supabase

## Steps to Complete

- [x] Update backend/requirements.txt: Remove motor and pymongo, add supabase
- [x] Update backend/server.py imports and client initialization
- [x] Rewrite database operations for users collection (partially done)
- [x] Rewrite database operations for campuses collection (partially done)
- [x] Rewrite database operations for academic_years collection (partially done)
- [x] Rewrite database operations for formations collection
- [x] Rewrite database operations for filieres collection (partially done)
- [x] Rewrite database operations for levels collection
- [x] Rewrite database operations for classes collection
- [x] Rewrite database operations for subjects collection
- [x] Rewrite database operations for students collection (partially done, search TODO)
- [ ] Rewrite database operations for professors collection
- [ ] Rewrite database operations for professor_hours collection
- [ ] Rewrite database operations for staff collection
- [ ] Rewrite database operations for grades collection
- [ ] Rewrite database operations for transactions collection
- [ ] Rewrite database operations for archives collection
- [ ] Rewrite database operations for student_absences collection
- [ ] Rewrite dashboard stats operations
- [ ] Update environment variables in .env file (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Set up Supabase database schema with tables matching MongoDB collections
- [ ] Test the application after migration
