<?php

/**
 * Interface and Base Class
 */

interface IException {
    /* Protected methods inherited from Exception class */
    public function getMessage();                 // Exception message
    public function getCode();                    // User-defined Exception code
    public function getFile();                    // Source filename
    public function getLine();                    // Source line
    public function getTrace();                   // An array of the backtrace()
    public function getTraceAsString();           // Formated string of trace

    /* Overrideable methods inherited from Exception class */
    public function __toString();                 // formated string for display
    public function __construct($message = null, $code = 0);
}

abstract class CustomException extends Exception implements IException {
    protected $message = 'Unknown exception';     // Exception message
    private   $string;                            // Unknown
    protected $code = 0;                          // User-defined exception code
    protected $file;                              // Source filename of exception
    protected $line;                              // Source line of exception
    private   $trace;                             // Unknown

    protected function callParent() {
        parent::__construct($this->message, $this->code);
    }

    public function __construct($message = null, $code = 0) {
        if ($message) {
            $this->message = $message;
        }
        if ($code) {
            $this->code = $code;
        }
        $this->callParent();
    }

    public function __toString() {
        return get_class($this) . " '{$this->message}' in {$this->file}({$this->line})\n"
                                . "{$this->getTraceAsString()}";
    }
}

/**
 * Custom Exception Classes
 */

class DbInsertFailedException extends CustomException {
    protected $message = 'The database insert failed.';
    protected $code = 4;
}

class GroupFullException extends CustomException {
    protected $message = 'The group has reached the maximum level of members. It is now full.';
    protected $code = 3;
}

class ObjectNotSpecifiedException extends CustomException {
    protected $message = 'An object must be specified.';
    protected $code = 1;
}

class ObjectNotValidException extends CustomException {
    protected $message = 'The specified object is invalid.';
    protected $code = 2;
}
