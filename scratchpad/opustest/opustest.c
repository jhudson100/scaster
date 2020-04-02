#include <stdio.h>
#include "opus.h"

//gcc -I/usr/include/opus opustest.c  -lopus

int sampleRate = 16000;
int freq = 880;
int seconds = 2;
int numChannels = 1;


int main(int argc, char* argv[]){
    int rv;
    int X;
    int* intPtr = &X;
   
    OpusEncoder* enc = opus_encoder_create( sampleRate, numChannels, OPUS_APPLICATION_VOIP, intPtr );
    printf("%p %d\n",enc,*intPtr);
    rv = opus_encoder_ctl( enc, OPUS_SET_BITRATE_REQUEST, 4000);
    printf("set bitrate: %d\n",rv);
    rv = opus_encoder_ctl( enc, OPUS_GET_BITRATE_REQUEST, intPtr );
    int theBitRate = *intPtr;
    printf("get bitrate: rv=%d bitrate=%d\n",rv,theBitRate);
    rv = opus_encoder_ctl( enc, 4001, intPtr );
    printf("get app: rv=%d app=%d\n",rv,*intPtr);
    return 0;
}
