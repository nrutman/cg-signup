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

    const SELECT_SIGNUPS_SQL = <<<'SQL'
SELECT s.*, g.name as group_name
FROM cg_signups s
JOIN cg_groups g ON s.group_id = g.id
ORDER BY s.is_leader DESC, s.id ASC
;
SQL;

}
