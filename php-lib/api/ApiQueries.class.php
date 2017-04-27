<?php

class ApiQueries {

    const INSERT_SIGNUP_SQL = <<<'SQL'
INSERT INTO cg_signups (group_id, first_name, last_name, email, phone, created_at)
VALUES (:group_id, :first_name, :last_name, :email, :phone, NOW())
;
SQL;

    const SELECT_CURRENT_SESSION_SQL = <<<'SQL'
SELECT *
FROM cg_sessions se
WHERE NOW() > se.signup_start AND NOW() < se.signup_end
;
SQL;

    const SELECT_NEXT_SESSION_SQL = <<<'SQL'
SELECT *
FROM cg_sessions se
WHERE NOW() < se.signup_end
ORDER BY se.signup_end ASC
;
SQL;

    const SELECT_GROUPS_SQL = <<<'SQL'
SELECT g.*
FROM cg_groups g
JOIN cg_sessions se ON g.session_id = se.id
WHERE NOW() > se.signup_start AND NOW() < se.signup_end
ORDER BY
    FIELD(g.day, 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') ASC,
    g.time ASC,
    g.name ASC
;
SQL;

    const SELECT_LAST_SIGNUP_SQL = <<<'SQL'
SELECT s.*
FROM cg_signups s
ORDER BY id DESC
LIMIT 1
;
SQL;

    const SELECT_SIGNUP_BY_ID = <<<'SQL'
SELECT s.*
FROM cg_signups s
WHERE s.id = :id
;
SQL;

    const SELECT_SIGNUP_FOR_GROUP_BY_SIGNUP_ID = <<<'SQL'
SELECT s.*, g.*
FROM cg_signups s
JOIN cg_groups g ON s.group_id = g.id
WHERE s.id = :signup_id
;
SQL;

    const SELECT_SIGNUPS_FOR_GROUP_SQL = <<<'SQL'
SELECT s.*, g.name as group_name
FROM cg_signups s
JOIN cg_groups g ON s.group_id = g.id
WHERE g.id = :group_id
ORDER BY s.is_leader DESC, s.id ASC
;
SQL;

    const SELECT_SIGNUPS_SQL = <<<'SQL'
SELECT s.*, g.name as group_name
FROM cg_signups s
JOIN cg_groups g ON s.group_id = g.id
JOIN cg_sessions se ON g.session_id = se.id
WHERE NOW() > se.signup_start AND NOW() < se.signup_end
ORDER BY s.is_leader DESC, s.id ASC
;
SQL;

    const UPDATE_SIGNUP_SQL = <<<'SQL'
UPDATE cg_signups
SET
    group_id = :group_id,
    first_name = :first_name,
    last_name = :last_name,
    email = :email,
    phone = :phone,
    is_leader = :is_leader,
    first_preference = :first_preference,
    preference_notes = :preference_notes,
    notes = :notes,
    created_at = :created_at
WHERE id = :id
;
SQL;

}
