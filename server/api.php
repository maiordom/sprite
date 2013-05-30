<?php

Class Sprite {
    var $imageMagickPath, $fileTypePattern;

    function __construct() {
        $this->imageMagickPath = 'C:\ImageMagick\convert';
        $this->fileTypePattern = '/data:image\/(jpeg|png|jpg|gif);base64,/';
        $this->route();
    }

    function isAvailableIM() {
        $out = Array();
        $err = -1;
        exec( $this->imageMagickPath . ' -version', $out, $err );
        return $err === 0;
    }

    function route() {
        $URI = $_SERVER[ 'REQUEST_URI' ];
        $matches = Array();
        preg_match( '/api\/(\w+)\?/', $URI, $matches );
        $method = $matches[ 1 ];

        switch( $method ) {
            case 'create_sprite': { $this->createSpriteHandle(); } break;
        }
    }

    function readSpriteData() {
        $index = 0;
        $isExist = array_key_exists( 'fileContent' . $index, $_REQUEST );
        $files = Array();

        while ( $isExist === true ) {
            $matches     = Array();
            $fileContent = $_REQUEST[ 'fileContent' . $index ];

            preg_match( $this->fileTypePattern, $fileContent, $matches );

            $fileType    = $matches[ 1 ];
            $fileContent = str_replace( 'data:image/' . $fileType . ';base64,', '', $_REQUEST[ 'fileContent' . $index ] );
            $dataURL     = base64_decode( $fileContent );

            $files[] = Array(
                'fileType' => $fileType,
                'fileContent' => $dataURL,
                'x' => $_REQUEST[ 'x' . $index ],
                'y' => $_REQUEST[ 'y' . $index ]
            );

            $isExist = array_key_exists( 'fileContent' . ++$index, $_REQUEST );
        }

        return $files;
    }

    function createSpriteTiles( &$files = Array() ) {
        for ( $i = 0, $len = count( $files ); $i < $len; $i++ ) {
            $tempPath = 'cache/temp' . $files[ $i ][ 'fileType' ];
            file_put_contents( $tempPath, $files[ $i ][ 'fileContent' ] );
            $fileHash = md5_file( $tempPath );
            $filePath = 'cache/' . $fileHash . '.' . $files[ $i ][ 'fileType' ];
            $files[ $i ][ 'filesPath' ] = $filePath;
            $files[ $i ][ 'fileHash' ] = $fileHash;
            rename( $tempPath, $filePath );    
        }
    }

    function getSumHash( $files ) {
        $hash = '';
        for ( $i = 0, $len = count( $files ); $i < $len; $i++ ) {
            $hash .= $files[ $i ][ 'fileHash' ];
        }
        return $hash;
    }

    function getIMC( $files = Array(), $sprite ) {
        $IMC = $this->imageMagickPath . ' -page ' . $_REQUEST[ 'width' ] . 'x' . $_REQUEST[ 'height' ] . ' ';

        for ( $i = 0, $len = count( $files ); $i < $len; $i++ ) {          
            $IMC .= '-page ' . '+' . $files[ $i ][ 'x' ] . '+' . $files[ $i ][ 'y' ] . ' ' . $files[ $i ][ 'filesPath' ] . ' ';
        }

        return $IMC . '-background transparent -flatten cache/' . $sprite . '.png';
    }

    function createSpriteHandle() {
        if ( !$this->isAvailableIM() ) {
            echo json_encode( Array(
                'result' => 'ERROR_IMAGE_MAGICK_NOT_AVAILABLE'
            ));
        } else {
            $files = $this->readSpriteData();

            if ( count( $files ) === 0 ) {
                echo json_encode( Array(
                    'result' => 'ERROR_ZERO_FILES'
                ));
            } else {
                $this->createSpriteTiles( $files );
                $spriteMD5 = md5( $this->getSumHash( $files ) );
                $IMC = $this->getIMC( $files, $spriteMD5 );
                $this->createSprite( $IMC, $spriteMD5 );

                echo json_encode( Array(
                    'result' => 'RESULT_OK',
                    'file' => $spriteMD5
                ));
            }
        }
    }

    function createSprite( $IMC, $sprite ) {
        $out = Array();
        $err = -1;
        exec( escapeshellcmd( $IMC ), $out, $err );
    }
}

$sprite = new Sprite();