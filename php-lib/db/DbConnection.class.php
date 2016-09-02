<?php

require_once(__DIR__ . '/../config/config.php');

class DbConnection {

    protected $conn;

    public function __construct() {
        $host = Config::$configuration['db.host'];
        $db = Config::$configuration['db.database'];
        $user = Config::$configuration['db.user'];
        $pass = Config::$configuration['db.password'];
        $charset = 'utf8';

        $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
        $opt = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        $this->conn = new PDO($dsn, $user, $pass, $opt);
    }

    public function getConnection() {
        return $this->conn;
    }
}
