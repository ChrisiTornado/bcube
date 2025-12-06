package com.bcube.userservice.utility;

import java.security.SecureRandom;

public class CodeGenerator {
    public static String generateCode() {
        SecureRandom secureRandom = new SecureRandom();
        int code = secureRandom.nextInt(1_000_000); // 0 bis 999999
        return String.format("%06d", code);
    }
}