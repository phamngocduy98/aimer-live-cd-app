<?php
    try {
        $ctx = stream_context_create(array('http' => array('timeout' => 60)));
        $id = $_GET['id'];
        $file = $_GET['file'];
        $host = "https://267d-2402-800-62d0-ba9c-e8f3-ee11-ffdf-904d.ngrok-free.app/api/part/"; // "https://music.btxa.io.vn/api/part/";

        $content = file_get_contents($host.$id."/".$file, false, $ctx);
        if($content === FALSE)
        {
            echo "failed";
            return;
        }
        file_put_contents($file, $content);
        echo "ok";
    } catch (e)
    {
        echo "failed";
    }
?>