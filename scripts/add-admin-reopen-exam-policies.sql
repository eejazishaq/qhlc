-- Required for admin "reopen exam" (update any user_exams row, delete user_answers when clearing answers).

DROP POLICY IF EXISTS "Admins can update all user exams" ON user_exams;
CREATE POLICY "Admins can update all user exams" ON user_exams
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND user_type IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admins can delete all answers" ON user_answers;
CREATE POLICY "Admins can delete all answers" ON user_answers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND user_type IN ('admin', 'super_admin')
        )
    );
