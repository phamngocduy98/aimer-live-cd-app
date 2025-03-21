<?php
    $files = scandir(".");
    echo join(",", array_slice($files, 2));
?>