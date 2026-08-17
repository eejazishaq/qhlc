-- Allow admins to update any user_answers row (manual evaluation).
-- RLS may only grant SELECT to admins without this.

DROP POLICY IF EXISTS "Admins can update all answers" ON user_answers;
CREATE POLICY "Admins can update all answers" ON user_answers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND user_type IN ('admin', 'super_admin')
        )
    );
