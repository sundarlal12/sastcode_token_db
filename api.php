<?php
header('Content-Type: application/json');
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['action'] ?? '';

$input = json_decode(file_get_contents("php://input"), true);

if ($path === 'storeToken' && $method === 'POST') {
    storeToken($pdo, $input);
} elseif ($path === 'getToken' && $method === 'POST') {
    getToken($pdo, $input);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Invalid endpoint']);
}

function storeToken($pdo, $data) {
    $required = ['git_client_id', 'git_client_secret', 'client_code', 'client_access_token', 'user_name'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "$field is required"]);
            return;
        }
    }

    $sql = "INSERT INTO github_user_details (git_client_id, git_client_secret, client_code, client_access_token, user_name)
            VALUES (:git_client_id, :git_client_secret, :client_code, :client_access_token, :user_name)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':git_client_id' => $data['git_client_id'],
        ':git_client_secret' => $data['git_client_secret'],
        ':client_code' => $data['client_code'],
        ':client_access_token' => $data['client_access_token'],
        ':user_name' => $data['user_name'],
    ]);

    echo json_encode(['message' => 'Token stored successfully']);
}

function getToken($pdo, $data) {
    if (empty($data['user_name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'user_name is required']);
        return;
    }

    $sql = "SELECT git_client_id, git_client_secret, client_code, client_access_token, user_name
            FROM github_user_details
            WHERE user_name = :user_name
            ORDER BY id DESC LIMIT 1";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':user_name' => $data['user_name']]);

    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        echo json_encode($result);
    } else {
        echo json_encode(['error' => 'User not found']);
    }
}
?>
