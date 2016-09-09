<?php

require_once('php-lib/api/ApiProcessor.class.php');
require_once('php-lib/api/ApiExceptions.php');

$api = new ApiProcessor;
header('Content-Type: application/json');
try {
    // read data
    $data = json_decode(file_get_contents('php://input'));
    if (is_object($data)) {
        $data = get_object_vars($data);
    }

    // process command
    $response = $api->processRequest($_GET['object'], $data);

    // handle response
    if (is_array($response) && empty($response)) {
        echo json_encode(array());
    }
    else if (empty($response) || !$response) {
        echo json_encode(new stdClass());
    } else {
        echo json_encode($response, JSON_NUMERIC_CHECK);
    }
} catch(Exception $e) {
    header("HTTP/1.1 400 Bad Request");
    echo json_encode(array(
        "code" => $e->getCode(),
        "message" => $e->getMessage()
    ));
}
