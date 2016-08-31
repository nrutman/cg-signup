<?php

class ApiDbConnection {

    protected $conn;

    public function __construct() {
        $host = '127.0.0.1;port=8889';
        $db = 'pcop';
        $user = 'root';
        $pass = 'root';
        $charset = 'utf8';

        $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
        $opt = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        $this->conn = new PDO($dsn, $user, $pass, $opt);
    }

    public function get_connection() {
        return $this->conn;
    }
}
