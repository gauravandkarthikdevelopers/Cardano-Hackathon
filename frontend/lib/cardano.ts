import { Lucid, Blockfrost } from 'lucid-cardano'

const BLOCKFROST_PROJECT_ID = process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID || ''

// Initialize Lucid instance
async function getLucid() {
    const lucid = await Lucid.new(
        new Blockfrost(
            'https://cardano-preprod.blockfrost.io/api/v0',
            BLOCKFROST_PROJECT_ID
        ),
        'Preprod'
    )
    return lucid
}

// Generate a new REAL Cardano wallet
export async function generateWallet() {
    try {
        const lucid = await getLucid()

        // Generate private key
        const privateKey = lucid.utils.generatePrivateKey()

        // Select wallet from private key
        lucid.selectWalletFromPrivateKey(privateKey)

        // Get address
        const address = await lucid.wallet.address()

        return {
            address,
            privateKey,
            mnemonic: privateKey // Using private key as mnemonic for storage
        }
    } catch (error) {
        console.error('Error generating wallet:', error)
        throw error
    }
}

// Get wallet balance from Blockfrost
export async function getWalletBalance(address: string): Promise<number> {
    try {
        const lucid = await getLucid()
        const utxos = await lucid.utxosAt(address)

        const totalLovelace = utxos.reduce((sum, utxo) => {
            return sum + utxo.assets.lovelace
        }, BigInt(0))

        return Number(totalLovelace) / 1_000_000 // Convert to ADA
    } catch (error) {
        console.error('Error fetching balance:', error)
        return 0
    }
}

// Send a REAL Cardano transaction
export async function sendTransaction(
    fromPrivateKey: string,
    toAddress: string,
    amountAda: number
): Promise<string> {
    try {
        const lucid = await getLucid()

        // Select wallet from private key
        lucid.selectWalletFromPrivateKey(fromPrivateKey)

        // Build transaction
        const tx = await lucid
            .newTx()
            .payToAddress(toAddress, { lovelace: BigInt(Math.floor(amountAda * 1_000_000)) })
            .complete()

        // Sign transaction
        const signedTx = await tx.sign().complete()

        // Submit transaction
        const txHash = await signedTx.submit()

        console.log(`Transaction submitted: ${txHash}`)
        return txHash
    } catch (error: any) {
        console.error('Error sending transaction:', error)
        throw new Error(`Failed to send transaction: ${error.message}`)
    }
}
