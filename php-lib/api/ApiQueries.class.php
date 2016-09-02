<?php

class ApiQueries {

    const INSERT_SIGNUP_SQL = <<<'SQL'
INSERT INTO cg_signups (group_id, first_name, last_name, email, phone, created_at)
VALUES (:group_id, :first_name, :last_name, :email, :phone, NOW())
;
SQL;

    const SELECT_GROUPS_SQL = <<<'SQL'
SELECT *
FROM cg_groups g
ORDER BY g.name ASC
;
SQL;

    const SELECT_LAST_SIGNUP_SQL = <<<'SQL'
SELECT *
FROM cg_signups
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
