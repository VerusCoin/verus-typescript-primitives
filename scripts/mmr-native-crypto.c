/*
 * Fixture adapter for the daemon's native Sapling primitives, not SDK crypto.
 * Uses only synthetic data and the checked-in public test viewing key.
 *
 * cc -O2 -I../VerusCoin/depends/aarch64-apple-darwin/include \
 *   scripts/mmr-native-crypto.c \
 *   ../VerusCoin/depends/aarch64-apple-darwin/lib/librustzcash.a \
 *   ../VerusCoin/depends/aarch64-apple-darwin/lib/libsodium.a \
 *   -framework Security -framework CoreFoundation -o /tmp/local-upload-native-crypto
 *
 * encrypt <43-byte-payment-address-hex> <plaintext-hex>
 * decrypt <ivk-hex> <epk-hex> <ciphertext-hex>
 * Use '-' for the plaintext/ciphertext argument to read raw bytes from stdin.
 */
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sodium.h>

/* The daemon header is C++-only; these exported functions have a C ABI. */
extern bool librustzcash_sapling_ka_agree(const unsigned char *, const unsigned char *, unsigned char *);
extern bool librustzcash_sapling_ka_derivepublic(const unsigned char *, const unsigned char *, unsigned char *);
extern void librustzcash_sapling_generate_r(unsigned char *);

static unsigned char *unhex(const char *value, size_t *length)
{
    size_t size = strlen(value);
    unsigned char *result = malloc(size / 2 + 1);
    if (!result || size % 2 || sodium_hex2bin(result, size / 2, value, size,
                                           NULL, length, NULL) != 0) {
        fprintf(stderr, "Invalid hex input\n");
        exit(2);
    }
    return result;
}

static void hex(const unsigned char *value, size_t length)
{
    for (size_t i = 0; i < length; i++) {
        printf("%02x", value[i]);
    }
}

/* Large fixture payloads use stdin to avoid the operating system's argv limit. */
static unsigned char *input_bytes(const char *value, size_t *length)
{
    if (strcmp(value, "-")) return unhex(value, length);

    size_t capacity = 4096;
    unsigned char *result = malloc(capacity);
    if (!result) exit(2);
    *length = 0;

    while (!feof(stdin)) {
        if (*length == capacity) {
            if (capacity >= 16 * 1024 * 1024) {
                fprintf(stderr, "Fixture input exceeds 16 MiB\n");
                exit(2);
            }
            capacity *= 2;
            unsigned char *expanded = realloc(result, capacity);
            if (!expanded) exit(2);
            result = expanded;
        }
        *length += fread(result + *length, 1, capacity - *length, stdin);
        if (ferror(stdin)) exit(2);
    }
    return result;
}

/* The descriptor KDF commits to the shared point followed by the ephemeral key. */
static void derive_key(unsigned char *key, const unsigned char *shared,
                       const unsigned char *epk)
{
    unsigned char input[64], personal[16] = "Zcash_SaplingKDF";
    memcpy(input, shared, 32);
    memcpy(input + 32, epk, 32);
    if (crypto_generichash_blake2b_salt_personal(key, 32, input, 64,
                                               NULL, 0, NULL, personal)) {
        exit(3);
    }
}

int main(int argc, char **argv)
{
    unsigned char key[32], shared[32], nonce[12] = {0};
    if (sodium_init() < 0 || argc < 2) return 2;

    if (!strcmp(argv[1], "encrypt") && argc == 4) {
        size_t address_len, plaintext_len;
        unsigned char *address = unhex(argv[2], &address_len);
        unsigned char *plaintext = input_bytes(argv[3], &plaintext_len);
        unsigned char esk[32], epk[32];
        unsigned char *ciphertext = malloc(plaintext_len + 16);
        if (address_len != 43 || !ciphertext) return 2;

        librustzcash_sapling_generate_r(esk);
        if (!librustzcash_sapling_ka_derivepublic(address, esk, epk) ||
            !librustzcash_sapling_ka_agree(address + 11, esk, shared)) return 3;
        derive_key(key, shared, epk);

        unsigned long long ciphertext_len;
        if (crypto_aead_chacha20poly1305_ietf_encrypt(ciphertext, &ciphertext_len,
            plaintext, plaintext_len, NULL, 0, NULL, nonce, key)) return 3;

        printf("{\"epk\":\"");
        hex(epk, 32);
        printf("\",\"ciphertext\":\"");
        hex(ciphertext, ciphertext_len);
        puts("\"}");

        sodium_memzero(esk, sizeof(esk));
        free(address);
        free(plaintext);
        free(ciphertext);
    } else if (!strcmp(argv[1], "decrypt") && argc == 5) {
        size_t ivk_len, epk_len, ciphertext_len;
        unsigned char *ivk = unhex(argv[2], &ivk_len);
        unsigned char *epk = unhex(argv[3], &epk_len);
        unsigned char *ciphertext = input_bytes(argv[4], &ciphertext_len);
        unsigned char *plaintext = malloc(ciphertext_len + 1);
        if (ivk_len != 32 || epk_len != 32 || ciphertext_len < 16 || !plaintext) return 2;

        if (!librustzcash_sapling_ka_agree(epk, ivk, shared)) return 3;
        derive_key(key, shared, epk);
        unsigned long long plaintext_len;
        if (crypto_aead_chacha20poly1305_ietf_decrypt(plaintext, &plaintext_len,
            NULL, ciphertext, ciphertext_len, NULL, 0, nonce, key)) {
            fprintf(stderr, "Ciphertext authentication failed\n");
            return 4;
        }

        hex(plaintext, plaintext_len);
        puts("");
        sodium_memzero(ivk, ivk_len);
        free(ivk);
        free(epk);
        free(ciphertext);
        free(plaintext);
    } else {
        return 2;
    }

    sodium_memzero(key, sizeof(key));
    sodium_memzero(shared, sizeof(shared));
    return 0;
}
