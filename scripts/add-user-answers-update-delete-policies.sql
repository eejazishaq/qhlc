-- Allow students to update and delete their own answers (same ownership as SELECT/INSERT).
-- Without these, changing an answer or clearing one can fail under RLS.

DROP POLICY IF EXISTS "Users can update own answers" ON user_answers;
CREATE POLICY "Users can update own answers" ON user_answers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_exams
            WHERE id = user_answers.user_exam_id
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own answers" ON user_answers;
CREATE POLICY "Users can delete own answers" ON user_answers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_exams
            WHERE id = user_answers.user_exam_id
            AND user_id = auth.uid()
        )
    );
