# 🎲 Kaspa NFT Lottery – 5 × 20 Segment Method

A simple, transparent, and verifiable lottery using **NFTs on the Kaspa blockchain**.  
The winner selection is based on a **winning number** extracted from the hash of the last minted NFT, then distributed using **5 segments of 20**.

---

## 📜 How It Works

1. **Create** 100 NFTs numbered from `01` to `100` (you can display `00` as `100` if needed).
2. **Sell / mint** all NFTs.
3. **Retrieve** the **hash of the last minted NFT**.
4. **Determine the winning number**:
   - Read the hash from left to right and **take the first two characters that are digits** (ignore letters).
   - These two digits form the **winning number** (from `01` to `99`).
   - If you get `00`, the winning number is `100`.
5. **Divide the players into 5 segments** of 20 numbers each:
   - `01–20`, `21–40`, `41–60`, `61–80`, `81–100`.
6. **Distribute the winnings** (based on the segment of the winning number):
   - The **NFT matching the winning number** is the **grand prize winner** (jackpot).
   - **All other NFTs in the same segment** are **“x2” winners** (e.g., double their stake).
   - **NFTs outside the segment** are **losers**.

> This rule is **always the same**, regardless of the winning number:  
> **1 grand prize winner** (exact match) + **19 x2 winners** (same segment) + **80 losers** (outside segment).

---

## 🔍 Examples

### Example A — Winning number in `41–60`
- **Winning number**: `51`
- **Grand winner**: NFT **#51**
- **x2 winners**: NFTs **#41 to #60** (except #51)
- **Losers**: NFTs **#01 to #40** and **#61 to #100**

---

### Example B — Winning number in `01–20`
- **Winning number**: `17`
- **Grand winner**: NFT **#17**
- **x2 winners**: NFTs **#01 to #20** (except #17)
- **Losers**: NFTs **#21 to #100**

---

### Example C — Winning number in `21–40`
- **Winning number**: `25`
- **Grand winner**: NFT **#25**
- **x2 winners**: NFTs **#21 to #40** (except #25)
- **Losers**: NFTs **#41 to #100**

---

### Example D — Winning number in `61–80`
- **Winning number**: `77`
- **Grand winner**: NFT **#77**
- **x2 winners**: NFTs **#61 to #80** (except #77)
- **Losers**: NFTs **#01 to #60** and **#81 to #100**

---

### Example E — Winning number in `81–100`
- **Winning number**: `91`
- **Grand winner**: NFT **#91**
- **x2 winners**: NFTs **#81 to #100** (except #91)
- **Losers**: NFTs **#01 to #80**  
> Note: If you use `00` to represent `100`, then `00` ≡ **#100**.

