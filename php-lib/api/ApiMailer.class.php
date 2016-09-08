<?php

require_once(__DIR__ . '/../../vendor/phpmailer/phpmailer/PHPMailerAutoload.php');

class ApiMailer {

    protected $templatesDir;

    public function __construct() {
        $this->templatesDir = __DIR__ . '/../templates';
    }

    protected function formatTime($time) {
        $pieces = explode(':', $time);

        if (count($pieces) < 2) {
            return $time;
        }

        $hours = (int) $pieces[0];
        $minutes = (int) $pieces[1];
        $ampm = 'AM';

        if ($hours > 12) {
            $hours -= 12;
            $ampm = 'PM';
        }

        return "$hours:$minutes $ampm";
    }

    protected function getMailer() {
        $mailer = new PHPMailer();
        $mailer->FromName = "Providence Church";
        $mailer->From = "office@provchurch.org";
        return $mailer;
    }

    protected function getTemplatePath($file) {
        return $this->templatesDir . '/' . $file;
    }

    protected function replaceValuesInFile($file, $values = array()) {
        $contents = file_get_contents($file);
        $patterns = array();
        $replacements = array();

        foreach ($values as $key => $value) {
            $patterns[] = '/\{\{' . $key . '\}\}/';
            $replacements[] = $value;
        }

        return preg_replace($patterns, $replacements, $contents);
    }

    public function sendConfirmation($data) {
        $data['time_formatted'] = $this->formatTime($data['time']);

        $mailer = $this->getMailer();

        $mailer->isHTML(true);
        $mailer->addAddress($data['email'], $data['first_name'] . ' ' . $data['last_name']);
        $mailer->Subject = 'You joined the ' . $data['name'] . ' Community Group';
        $mailer->Body = $this->replaceValuesInFile($this->getTemplatePath('ConfirmationEmail.html'), $data);
        $mailer->AltBody = $this->replaceValuesInFile($this->getTemplatePath('ConfirmationEmail.txt'), $data);

        $mailer->send();
    }
}
