<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once 'db_config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->fullname) && !empty($data->email) && !empty($data->subject) && !empty($data->message)) {
    $query = "INSERT INTO messages (fullname, email, subject, message) VALUES (:fullname, :email, :subject, :message)";
    
    $stmt = $conn->prepare($query);
    
    $fullname = htmlspecialchars(strip_tags($data->fullname));
    $email = htmlspecialchars(strip_tags($data->email));
    $subject = htmlspecialchars(strip_tags($data->subject));
    $message = htmlspecialchars(strip_tags($data->message));
    
    $stmt->bindParam(":fullname", $fullname);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":subject", $subject);
    $stmt->bindParam(":message", $message);
    
    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(array("message" => "Message sent successfully."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to send message."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. Please fill all fields."));
}
?>
