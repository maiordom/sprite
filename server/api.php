<?php

Class Sprite {
    var $imageMagickPath, $fileTypePattern;

    function __construct() {
        $this->imageMagickPath = 'C:\ImageMagick\convert';
        $this->fileTypePattern = '/data:image\/(jpeg|png|jpg|gif);base64,/';
        
        if ( !$this->isAvailableIM() ) {
            echo json_encode( Array(
                'result' => 'ERROR_IMAGE_MAGICK_NOT_AVAILABLE'
            ));
            exit( 0 );    
        }

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
        preg_match( '/api\/(\w+)(\?|$)/', $URI, $matches );
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
            $type = $files[ $i ][ 'fileType' ];
            $tempPath = 'cache/temp.' . $type;
            file_put_contents( $tempPath, $files[ $i ][ 'fileContent' ] );

            if ( $type !== 'png' ) {
                $this->exec( $this->imageMagickPath . ' ' . $tempPath . ' ' . 'cache/temp.png' );
                unlink( $tempPath );
                $tempPath = 'cache/temp.png';
                $files[ $i ][ 'fileType' ] = 'png';
                $type = 'png';
            }

            $fileHash = md5_file( $tempPath );
            $filePath = 'cache/' . $fileHash . '.' . $type;
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

    function getCmdToCreateSprite( $files = Array(), $sprite ) {
        $IMC = $this->imageMagickPath . ' -page ' . $_REQUEST[ 'width' ] . 'x' . $_REQUEST[ 'height' ] . ' ';

        for ( $i = 0, $len = count( $files ); $i < $len; $i++ ) {          
            $IMC .= '-page ' . '+' . $files[ $i ][ 'x' ] . '+' . $files[ $i ][ 'y' ] . ' cache/' . $files[ $i ][ 'fileHash' ] . '.png ';
        }

        return $IMC . '-background transparent -flatten cache/' . $sprite . '.png';
    }

    function createImageHandle() {
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

    function createSpriteHandle() {
        $files = $this->readSpriteData();

        if ( count( $files ) === 0 ) {
            echo json_encode( Array(
                'result' => 'ERROR_ZERO_TOKENS'
            ));
        } else {
            $token = md5( $this->getSumHash( $files ) );
            $cmd = $this->getCmdToCreateSprite( $files, $token );
            $this->exec( $cmd );
            $this->createSpriteZip( $token );

            echo json_encode( Array(
                'result' => 'RESULT_OK',
                'token' => $token
            ));
        }
    }

    function createSpriteZip( $token ) {
        $zip = new ZipArchive();
        $fileName = 'zip/' . $token . '.zip';

        if ( $zip->open( $fileName, ZIPARCHIVE::CREATE ) !== true ) {
            fwrite( STDERR, 'Error while creating archive file' );
            exit( 0 );
        }

        $zip->addFile( 'cache/' . $token . '.png', $token . '.png' );
        $zip->close();
    }

    function exec( $cmd ) {
        $out = Array();
        $err = -1;
        exec( escapeshellcmd( $cmd ), $out, $err );
    }
}

$sprite = new Sprite();