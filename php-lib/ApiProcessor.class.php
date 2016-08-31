<?php

require_once('ApiCommands.class.php');

class ApiProcessor {
    protected $commands;

    public function __construct() {
        $this->commands = new ApiCommands;
    }

    public function processRequest($object, $data) {
        $method = strtolower($_SERVER['REQUEST_METHOD']) . '_' . $object;

        if (empty($object)) {
            throw new Exception("An object must be specified.");
        }

        if (!method_exists($this->commands, $method)) {
            throw new Exception("The specified object ($object) is invalid.");
        }

        return call_user_func(array($this->commands, $method), $data);
    }
}
