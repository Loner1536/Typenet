const Constant = {
    MAX_PAYLOAD: 1048576,
    WRITER_BYTE_SIZE: 1048576,

    LIB_NAME: "TYPENET",
    FOLDER_NAME: "__TYPNET",
    RELIABLE_NAME: "RELIABLE__",
    UNRELIABLE_NAME: "UNRELIABLE__",

    HANDSHAKE_PACKET_ID: 0,
    HANDSHAKE_TIMEOUT: 10,

    U8_MAX: 0xff,
    U16_MAX: 0xffff,
    U24_MAX: 0xffffff,
    U32_MAX: 0xffffffff,

    I8_MIN: -0x80,
    I8_MAX: 0x7f,
    I16_MIN: -0x8000,
    I16_MAX: 0x7fff,
    I32_MIN: -0x80000000,
    I32_MAX: 0x7fffffff,

    MAX_ARRAY_LENGTH: 1000,
    MAX_PACKET_ID: 0xffff,
};

export default Constant;
