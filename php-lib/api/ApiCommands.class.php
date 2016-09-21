<?php

require_once('ApiMailer.class.php');
require_once('ApiQueries.class.php');
require_once(__DIR__ . '/../db/DbConnection.class.php');

class ApiCommands {
    protected $db;
    const MAX_SIGNUPS = 12;

    public function __construct() {
        $this->db = new DbConnection();
    }

    /**
     * Helper Methods
     */

    protected function getSignupsForGroup($groupId) {
        $statement = $this->db->getConnection()->prepare(ApiQueries::SELECT_SIGNUPS_FOR_GROUP_SQL);
        $statement->execute(array('group_id' => $groupId));
        return $statement->fetchAll();
    }

    protected function query($query, $values = array()) {
        $statement = $this->db->getConnection()->prepare($query);
        if (!$statement->execute($values)) {
            throw new DbStatementFailedException();
        };
        return $statement;
    }

    protected function returnOne($value) {
        if (!is_array($value) || count($value) < 1) {
            return null;
        }
        return $value[0];
    }

    /**
     * Action Methods
     */

    public function getCurrentSessionAction() {
        return $this->returnOne($this->query(ApiQueries::SELECT_CURRENT_SESSION_SQL)->fetchAll());
    }

    public function getGroupsAction() {
        return $this->query(ApiQueries::SELECT_GROUPS_SQL)->fetchAll();
    }

    public function getSignupsAction() {
        return $this->query(ApiQueries::SELECT_SIGNUPS_SQL)->fetchAll();
    }

    public function putSignupAction($data) {
        if (!is_numeric($data['id'])) {
            throw new ObjectNotValidException();
        }

        $this->query(ApiQueries::UPDATE_SIGNUP_SQL, $data);
        return $this->returnOne($this->query(ApiQueries::SELECT_SIGNUP_BY_ID, array('id' => $data['id']))->fetchAll());
    }

    public function postSignupAction($data) {
        // make sure the group isn't full
        $signups = $this->getSignupsForGroup($data['group_id']);
        if (count($signups) >= self::MAX_SIGNUPS) {
            throw new GroupFullException();
        }

        // whitelist data
        $signup = array_intersect_key($data, array(
            'group_id' => 1,
            'first_name' => 1,
            'last_name' => 1,
            'email' => 1,
            'phone' => 1
        ));

        // insert data and get the row inserted
        $this->query(ApiQueries::INSERT_SIGNUP_SQL, $signup);
        $insertedRow = $this->returnOne($this->query(ApiQueries::SELECT_LAST_SIGNUP_SQL)->fetchAll());

        // send the confirmation email
        $signupAndGroup = $this->returnOne($this->query(ApiQueries::SELECT_SIGNUP_FOR_GROUP_BY_SIGNUP_ID, array( 'signup_id' => (int) $insertedRow['id'] ))->fetchAll());
        $mailer = new ApiMailer();
        $mailer->sendConfirmation($signupAndGroup);

        // return the row that was inserted
        return $insertedRow;
    }

}
