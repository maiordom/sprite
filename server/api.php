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
            case 'create_image':  { $this->createImageHandle();  } break;
        }
    }

    function readImageData() {
        $isExist = array_key_exists( 'fileContent', $_REQUEST );
        $files = Array();

        if ( $isExist === true ) {
            $matches     = Array();
            $fileContent = $_REQUEST[ 'fileContent' ];

            preg_match( $this->fileTypePattern, $fileContent, $matches );

            $fileType    = $matches[ 1 ];
            $fileContent = str_replace( 'data:image/' . $fileType . ';base64,', '', $fileContent );
            $dataURL     = base64_decode( $fileContent );

            $files[] = Array(
                'fileType' => $fileType,
                'fileContent' => $dataURL
            );
        }

        return $files;
    }

    function readSpriteData() {
        $i = 0;
        $isExist = array_key_exists( 'token' . $i, $_REQUEST );
        $files = Array();

        while ( $isExist === true ) {
            $files[] = Array(
                'fileHash' => $_REQUEST[ 'token' . $i ],
                'x' => $_REQUEST[ 'x' . $i ],
                'y' => $_REQUEST[ 'y' . $i ]
            );

            ++$i;
            $isExist = array_key_exists( 'token' . $i, $_REQUEST );
        }

        return $files;
    }

    function createImage( &$files = Array() ) {
        for ( $i = 0, $len = count( $files ); $i < $len; $i++ ) {
            $tempPath = 'cache/temp.' . $files[ $i ][ 'fileType' ];
            file_put_contents( $tempPath, $files[ $i ][ 'fileContent' ] );
            $fileHash = md5_file( $tempPath );
            $filePath = 'cache/' . $fileHash . '.' . $files[ $i ][ 'fileType' ];
            $files[ $i ][ 'filesPath' ] = $filePath;
            $files[ $i ][ 'fileHash' ]  = $fileHash;
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
            $IMC .= '-page ' . '+' . $files[ $i ][ 'x' ] . '+' . $files[ $i ][ 'y' ] . ' cache/' . $files[ $i ][ 'fileHash' ] . '.png ';
        }

        return $IMC . '-background transparent -flatten cache/' . $sprite . '.png';
    }

    function createImageHandle() {
        if ( !$this->isAvailableIM() ) {
            echo json_encode( Array(
                'result' => 'ERROR_IMAGE_MAGICK_NOT_AVAILABLE'
            ));
        } else {
            $files = $this->readImageData();

            if ( count( $files ) === 0 ) {
                echo json_encode( Array(
                    'result' => 'ERROR_ZERO_FILES'
                ));
            } else {
                $this->createImage( $files );
                
                echo json_encode( Array(
                    'result' => 'RESULT_OK',
                    'token' => $files[ 0 ][ 'fileHash' ]
                ));
            }
        }
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
                    'result' => 'ERROR_ZERO_TOKENS'
                ));
            } else {
                $token = md5( $this->getSumHash( $files ) );
                $IMC = $this->getIMC( $files, $token );
                $this->exec( $IMC );

                echo json_encode( Array(
                    'result' => 'RESULT_OK',
                    'token' => $token
                ));
            }
        }
    }

    function exec( $cmd ) {
        $out = Array();
        $err = -1;
        exec( escapeshellcmd( $cmd ), $out, $err );
    }
}

$sprite = new Sprite();