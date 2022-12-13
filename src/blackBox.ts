import fs from "fs";
import {Session} from "./transaction";

const { Seal } = require("node-seal");
type Context = any

type PubKey = any
type PrivKey = any

/**
 * Wrapper around node-seal operations.
 * This blackbox provides access mathematical functions
 * that can operate on encrypted numbers
 * https://github.com/microsoft/SEAL/blob/master/README.md
 *
 * We assume that when use with key rotation SEAL/HE should be sufficent for our purposes
 * but we do not assume it will provide anonymity.
 *
 */
export class BlackBox {
    private HE: any;

    /**
     * Construct new Seal HE Context
     */
    async ctx(): Promise<Context> {
        // REVIEW: can these parameters be tuned to
        // account for the max size of a vector?
        // these params were borrowed from an example in the node-seal repo
        const polyModulusDegree = 4096;
        const bitSizes = [36, 36, 37];
        const bitSize = 20;

        this.HE = await Seal();
        const params = this.HE.EncryptionParameters(this.HE.SchemeType.BFV);

        params.setPolyModulusDegree(polyModulusDegree); // Set the PolyModulusDegree
        params.setCoeffModulus( // Create a suitable set of CoeffModulus primes
            this.HE.CoeffModulus.Create(polyModulusDegree, Int32Array.from(bitSizes))
        );
        params.setPlainModulus( // Set the PlainModulus to a prime of bitSize 20.
            this.HE.PlainModulus.Batching(polyModulusDegree, bitSize)
        );

        const context = this.HE.Context(
            params, // Encryption Parameters
            true, // ExpandModChain
            this.HE.SecurityLevel.tc128 // Enforce a security level
        );

        if (!context.parametersSet()) {
            throw new Error(
                "Could not set the parameters in the given context. Please try different encryption parameters."
            );
        }
        return context;
    }

    /**
     * generate new pub/priv keys
     * @param context
     */
    genKeys(context: Context): [PubKey, PrivKey] {
        const keyGenerator = this.HE.KeyGenerator(context);
        const pub = keyGenerator.publicKey();
        const priv = keyGenerator.secretKey();
        fs.writeFileSync("test/publicKey.asc", pub.save(), {});
        fs.writeFileSync("test/secretKey.asc", priv.save(), {});

        return [pub, priv];
    }

    /**
     * Load key files from filesystem
     * @param context
     */
    loadKeys(context: Context): [PubKey, PrivKey] {
        // FIXME: currently hardcoded for dev
        const priv = fs.readFileSync("test/secretKey.asc");
        const pub = fs.readFileSync("test/publicKey.asc");
        const pubKey = this.HE.PublicKey();
        pubKey.load(context, pub);
        const privKey = this.HE.SecretKey();
        privKey.load(context, priv);

        return [pubKey, privKey];
    }

    /**
     * Build the HE Session from context
     * @param context
     */
    newSession(context: Context): Session {
        //const [publicKey, secretKey] = this.genKeys(context)
        const [publicKey, secretKey] = this.loadKeys(context);
        const encoder = this.HE.BatchEncoder(context);
        const evaluator = this.HE.Evaluator(context);

        return {
            encrypt: this.HE.Encryptor(context, publicKey).encrypt,
            decrypt: this.HE.Decryptor(context, secretKey).decrypt,
            encode: encoder.encode,
            decode: encoder.decode,
            evaluate: evaluator,
        };

    }
}
