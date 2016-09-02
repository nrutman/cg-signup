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
            throw new ObjectNotSpecifiedException();
        }

        if (!method_exists($this->commands, $method)) {
            throw new ObjectNotValidException($object);
        }

        return call_user_func(array($this->commands, $method), $data);
    }
}
