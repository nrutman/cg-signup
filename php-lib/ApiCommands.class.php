<?php

require_once('ApiDbConnection.class.php');
require_once('ApiQueries.class.php');

class ApiCommands {
    protected $db;
    const MAX_SIGNUPS = 12;

    public function __construct() {
        $this->db = new ApiDbConnection();
    }

    protected function query($query) {
        return $this->db->get_connection()->query($query);
    }

    protected function insert($query, $values) {
        $statement = $this->db->get_connection()->prepare($query);
        $result = $statement->execute($values);
        if (!result) {
            throw new DbInsertFailedException();
        }
        return $result;
    }

    protected function return_one($value) {
        if (!is_array($value) || count($value) < 1) {
            return null;
        }
        return $value[0];
    }

    public function get_groups() {
        return $this->query(ApiQueries::SELECT_GROUPS_SQL)->fetchAll();
    }

    public function get_signups() {
        return $this->query(ApiQueries::SELECT_SIGNUPS_SQL)->fetchAll();
    }

    public function post_signup($signup) {
        $signups = $this->get_signups();
        if (count($signups) >= self::MAX_SIGNUPS) {
            throw new GroupFullException();
        }
        $signup = array_intersect_key($signup, array(
            'group_id' => 1,
            'first_name' => 1,
            'last_name' => 1,
            'email' => 1,
            'phone' => 1
        ));
        $this->insert(ApiQueries::INSERT_SIGNUP_SQL, $signup);
        return $this->return_one($this->query(ApiQueries::SELECT_LAST_SIGNUP_SQL)->fetchAll());
    }

}
