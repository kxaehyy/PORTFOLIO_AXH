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

if (!empty($data->email) && !empty($data->password)) {
    
    $query = "SELECT id, fullname, password FROM users WHERE email = :email LIMIT 0,1";
    $stmt = $conn->prepare($query);
    
    $email = htmlspecialchars(strip_tags($data->email));
    $stmt->bindParam(":email", $email);
    $stmt->execute();
    
    $num = $stmt->rowCount();
    
    if($num > 0){
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $password_hash = $row['password'];
        
        // Check if password matches
        if(password_verify($data->password, $password_hash)) {
            http_response_code(200);
            echo json_encode(array(
                "message" => "Login successful.",
                "user" => array(
                    "id" => $row['id'],
                    "fullname" => $row['fullname'],
                    "email" => $email
                )
            ));
        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Invalid email or password."));
        }
    } else {
        http_response_code(401);
        echo json_encode(array("message" => "Invalid email or password."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. Please enter email and password."));
}
?>
