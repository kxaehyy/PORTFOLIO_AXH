<?php
// headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Database credentials
$host = "localhost";
$db_name = "portfolio_axh";
$username = "root";       // Change this if your database username is different
$password = "";           // Change this if your database has a password

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(array("message" => "Database connection error: " . $exception->getMessage()));
    exit();
}

// Get the posted data
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->fullname) && !empty($data->email) && !empty($data->subject) && !empty($data->message)) {
    
    // Prepare SQL query
    $query = "INSERT INTO messages (fullname, email, subject, message) VALUES (:fullname, :email, :subject, :message)";
    
    $stmt = $conn->prepare($query);
    
    // Sanitize input
    $fullname = htmlspecialchars(strip_tags($data->fullname));
    $email = htmlspecialchars(strip_tags($data->email));
    $subject = htmlspecialchars(strip_tags($data->subject));
    $message = htmlspecialchars(strip_tags($data->message));
    
    // Bind parameters
    $stmt->bindParam(":fullname", $fullname);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":subject", $subject);
    $stmt->bindParam(":message", $message);
    
    if ($stmt->execute()) {
        http_response_code(201); // Created
        echo json_encode(array("message" => "Message sent successfully."));
    } else {
        http_response_code(503); // Service unavailable
        echo json_encode(array("message" => "Unable to send message."));
    }
} else {
    http_response_code(400); // Bad request
    echo json_encode(array("message" => "Incomplete data. Please fill all fields."));
}
?>
