<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once 'db_config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    
    // Check if the input matches email or fullname (username)
    $query = "SELECT id, fullname, password, email FROM users WHERE email = :identifier OR fullname = :identifier LIMIT 0,1";
    $stmt = $conn->prepare($query);
    
    $identifier = htmlspecialchars(strip_tags($data->email));
    $stmt->bindParam(":identifier", $identifier);
    $stmt->execute();
    
    $num = $stmt->rowCount();
    
    if($num > 0){
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $password_hash = $row['password'];
        
        if(password_verify($data->password, $password_hash)) {
            http_response_code(200);
            echo json_encode(array(
                "message" => "Login successful.",
                "user" => array(
                    "id" => $row['id'],
                    "fullname" => $row['fullname'],
                    "email" => $row['email']
                )
            ));
        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Invalid username or password."));
        }
    } else {
        http_response_code(401);
        echo json_encode(array("message" => "Invalid username or password."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. Please enter username and password."));
}
?>
