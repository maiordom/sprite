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

    function uuid() {
        $chars = md5( uniqid( rand() ) );
        $uuid  = substr( $chars, 0,  8 ) .
                 substr( $chars, 8,  4 ) .
                 substr( $chars, 12, 4 ) .
                 substr( $chars, 16, 4 ) .
                 substr( $chars, 20, 12 );

        return $uuid;
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
                'fileType'    => $fileType,
                'fileContent' => $dataURL,
                'uuid'        => $this->uuid()
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
                'x'        => $_REQUEST[ 'x'     . $i ],
                'y'        => $_REQUEST[ 'y'     . $i ],
                'name'     => $_REQUEST[ 'name'  . $i ],
                'w'        => $_REQUEST[ 'w'     . $i ],
                'h'        => $_REQUEST[ 'h'     . $i ]
            );

            ++$i;
            $isExist = array_key_exists( 'token' . $i, $_REQUEST );
        }

        return $files;
    }

    function createImage( &$files = Array() ) {
        for ( $i = 0, $len = count( $files ); $i < $len; $i++ ) {
            $type = $files[ $i ][ 'fileType' ];
            $uuid = $files[ $i ][ 'uuid' ];
            $tempPath = 'cache/' . $uuid . '.' . $type;
            file_put_contents( $tempPath, $files[ $i ][ 'fileContent' ] );
            $fileHash = md5_file( $tempPath );
            $files[ $i ][ 'fileHash' ] = $fileHash;
            $filePath = 'cache/' . $fileHash . '.png';

            if ( $type !== 'png' ) {
                $this->execCmd( $this->imageMagickPath . ' ' . $tempPath . ' ' . $filePath );
                unlink( $tempPath );
                $files[ $i ][ 'fileType' ] = 'png';
            } else {
                rename( $tempPath, $filePath );
            }
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
                'token'  => $files[ 0 ][ 'fileHash' ],
                'uuid'   => $files[ 0 ][ 'uuid' ]
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
            $this->execCmd( $cmd );
            $this->createSpriteCSS( $token, $files, 'css', ';', true );
            $this->createSpriteCSS( $token, $files, 'styl', '', false );
            $this->createSpriteZip( $token );
            $this->removeZipItems( $token );

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

        $zip->addFile( 'cache/' . $token . '.png',  $token . '.png'  );
        $zip->addFile( 'cache/' . $token . '.css',  $token . '.css'  );
        $zip->addFile( 'cache/' . $token . '.styl', $token . '.styl' );
        $zip->close();
    }

    function removeZipItems( $token ) {
        $this->removeFile( 'cache/' . $token . '.png'  );
        $this->removeFile( 'cache/' . $token . '.css'  );
        $this->removeFile( 'cache/' . $token . '.styl' );
    }

    function removeFile( $file ) {
        file_exists( $file ) === true ? unlink( $file ) : null;
    }

    function createSpriteCSS( $token, $files, $type, $sem, $braces = true ) {
        $f = fopen( 'cache/' . $token . '.' . $type, 'w' );

        for ( $i = 0, $len = count( $files ); $i < $len; $i++ ) {
            $o = $files [ $i ];
            fwrite( $f, '.' . $o[ 'name' ] . ( $braces ? ' {' : '' ) . PHP_EOL );
            fwrite( $f, '    width: ' . $o[ 'w' ] . 'px' . $sem . PHP_EOL );
            fwrite( $f, '    height: ' . $o[ 'h' ] . 'px' . $sem . PHP_EOL );
            fwrite( $f, '    background-position: ' . $o[ 'x' ] . 'px ' . $o[ 'y' ] . 'px' . $sem . PHP_EOL );
            fwrite( $f, ( $braces ? '}' : '' ) . PHP_EOL );
        }

        fclose( $f );
    }

    function execCmd( $cmd ) {
        $out = Array();
        $err = -1;
        exec( escapeshellcmd( $cmd ), $out, $err );
    }
}

$sprite = new Sprite();