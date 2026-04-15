<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$host = "localhost";
$db_name = "portfolio_axh";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(array("message" => "Database connection error: " . $exception->getMessage()));
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->fullname) && !empty($data->email) && !empty($data->password)) {
    
    // Check if email already exists
    $check_query = "SELECT id FROM users WHERE email = :email";
    $check_stmt = $conn->prepare($check_query);
    $email = htmlspecialchars(strip_tags($data->email));
    $check_stmt->bindParam(":email", $email);
    $check_stmt->execute();
    
    if($check_stmt->rowCount() > 0) {
        http_response_code(409); // Conflict
        echo json_encode(array("message" => "Email already exists."));
        exit();
    }
    
    $query = "INSERT INTO users (fullname, email, password) VALUES (:fullname, :email, :password)";
    $stmt = $conn->prepare($query);
    
    $fullname = htmlspecialchars(strip_tags($data->fullname));
    // Hash the password for security
    $password_hash = password_hash($data->password, PASSWORD_BCRYPT);
    
    $stmt->bindParam(":fullname", $fullname);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":password", $password_hash);
    
    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(array("message" => "User registered successfully."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to register user."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. Please fill all fields."));
}
?>
