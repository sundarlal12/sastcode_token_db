<?php
$host = 'dpg-d0htc2mmcj7s739ganbg-a.oregon-postgres.render.com';
$db   = 'git_user';
$user = 'git_user_user';
$pass = 'aRVTFd1KyTk7X0NxTKnm6k6g0gksuQBh';
$dsn  = "pgsql:host=$host;port=5432;dbname=$db;";

try {
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
?>
