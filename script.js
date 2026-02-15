// Shared cache for NFT data to avoid duplicate API calls
let nftDataCache = {};

function searchNFTCollection() {
    const nftCollection = document.getElementById('nft-collection').value.trim();

    // Clear cache when searching a new collection
    nftDataCache = {};

    // Update elements only if they exist
    const currentNftCollection = document.getElementById('current-nft-collection');
    const currentNftCollection2 = document.getElementById('current-nft-collection2');
    const currentNftCollectionHeader = document.getElementById('current-nft-collection-header');

    if (currentNftCollection) currentNftCollection.textContent = nftCollection;
    if (currentNftCollection2) currentNftCollection2.textContent = nftCollection;
    if (currentNftCollectionHeader) currentNftCollectionHeader.textContent = nftCollection;

    document.getElementById('minted-value').textContent = 'Loading...';
    document.getElementById('max-value').textContent = 'Loading...';

    // Update the magic link URL only if it exists (only on index page)
    const magicLink = document.getElementById('nft-ticket-link');
    if (magicLink) {
        magicLink.href = `https://kaspa.com/nft/collections/${nftCollection}`;
    }

    // Set wallet address based on collection
    const walletAddressLink = document.getElementById('wallet-address-link');
    let walletAddress = '';

    if (nftCollection === 'AURORA') {
        walletAddress = 'kaspa:qz9uvc0f6xk3wlg8mx99v3zygksg8pkw80jvgjlkxmzps44h2g4s5dyxdllq2';
    } else if (nftCollection === 'KASPER') {
        walletAddress = 'kaspa:qqtvjm7qpfdq4kax4ccqymrhdem22wfs9aqlfl4tw5lscvek5nafqqhhng67g';
    } else if (nftCollection === 'PACMAN') {
        walletAddress = 'kaspa:qpn2ghqyzlydtqxcy7wp7l6jj098pdm6jxh5rn29hnhff3m2d7j0g46tjkr3f';
    } else if (nftCollection === 'SKETCHES') {
        walletAddress = 'kaspa:qr8h4tq9t9q9q9q9q9q9q9q9q9q9q9q9q9q9q9q9q9q9q9';
    }

    if (walletAddressLink) {
        // Display only the first 10 characters + "..."
        walletAddressLink.textContent = walletAddress.substring(0, 10) + '...';
        walletAddressLink.href = `https://explorer.kaspa.org/addresses/${walletAddress}`;
    }

    fetch(`https://mainnet.krc721.stream/api/v1/krc721/mainnet/nfts/${nftCollection}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.result) {
                document.getElementById("minted-value").textContent = data.result.minted || "Not found";
                document.getElementById("max-value").textContent = data.result.max || "Not found";

                // Calculate remaining NFTs
                const remaining = data.result.max - data.result.minted;
                document.getElementById("remaining-value").textContent = remaining >= 0 ? remaining : "NA";

                // Update mint link only if element exists
                const mintLinkContainer = document.getElementById('mint-link-container');
                if (mintLinkContainer) {
                    updateMintLink(nftCollection, remaining);
                }

                // Populate the table AND update last mint hash using shared data
                populateNFTTable(nftCollection, data.result.max, data.result.minted);
            } else {
                document.getElementById("minted-value").textContent = "Not found";
                document.getElementById("max-value").textContent = "Not found";
                document.getElementById("remaining-value").textContent = "NA";

                const mintLinkContainer = document.getElementById('mint-link-container');
                if (mintLinkContainer) {
                    mintLinkContainer.innerHTML = '';
                }
                clearNFTTable();
            }
        })
        .catch(error => {
            console.error("Error:", error.message);
            document.getElementById("minted-value").textContent = "NA";
            document.getElementById("max-value").textContent = "NA";
            document.getElementById("remaining-value").textContent = "NA";

            const mintLinkContainer = document.getElementById('mint-link-container');
            if (mintLinkContainer) {
                mintLinkContainer.innerHTML = '';
            }
        });
}

// Add new function to handle mint link
function updateMintLink(collection, remaining) {
    const container = document.getElementById('mint-link-container');
    if (remaining > 0) {
        container.innerHTML = `<a href="https://kaspa.com/nft/collections/${collection}" target="_blank">Mint NFT from this collection</a>`;
    } else {
        container.innerHTML = '';
    }
}

// Add event listener for Enter key
document.getElementById('nft-collection').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        searchNFTCollection();
    }
});

// Add event listener for dropdown change
document.getElementById('nft-collection').addEventListener('change', function (event) {
    searchNFTCollection();
});

// Load default collection on page load
document.addEventListener('DOMContentLoaded', function () {
    searchNFTCollection();
});

function clearNFTTable() {
    const tbody = document.getElementById('nft-table-body');
    if (tbody) {
        tbody.innerHTML = '';
    }
}

async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            // 404 = token not found/not minted → return null immediately, no retry
            if (response.status === 404) {
                return null;
            }
            // Other non-OK responses → throw to trigger retry
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}

// Show a loading indicator in the table
function showLoadingIndicator(tableBody, message) {
    tableBody.innerHTML = `
        <tr id="loading-row">
            <td colspan="6" style="text-align: center; padding: 40px; font-size: 1.2rem;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                    <div class="loading-spinner"></div>
                    <span id="loading-message">${message}</span>
                </div>
            </td>
        </tr>
    `;
}

// Update loading progress message
function updateLoadingProgress(loaded, total) {
    const msg = document.getElementById('loading-message');
    if (msg) {
        msg.textContent = `Loading NFT data... ${loaded}/${total}`;
    }
}

// Fetch a single token's data (token info + history + block time)
async function fetchTokenData(collection, tokenId) {
    try {
        const [tokenData, historyData] = await Promise.all([
            fetchWithRetry(`https://mainnet.krc721.stream/api/v1/krc721/mainnet/nfts/${collection}/${tokenId}`),
            fetchWithRetry(`https://mainnet.krc721.stream/api/v1/krc721/mainnet/history/${collection}/${tokenId}`)
        ]);

        // Handle 404 / null responses (token not minted)
        const isMinted = tokenData?.result?.owner ? true : false;
        const txId = historyData?.result?.[0]?.txIdRev || null;
        const mintOwner = historyData?.result?.[0]?.owner || 'Not minted';

        let blockTime = 'Not minted';
        let timestamp = null;
        let hash = null;

        if (txId) {
            const txData = await fetchWithRetry(`https://api.kaspa.org/transactions/${txId}`);
            if (txData && txData.block_time) {
                timestamp = txData.block_time;
                const date = new Date(txData.block_time);
                blockTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
            }
            hash = txData?.hash || null;
        }

        return {
            tokenId,
            isMinted,
            mintOwner,
            txId,
            blockTime,
            timestamp,
            hash,
            error: false
        };
    } catch (error) {
        console.error(`Error processing token ${tokenId}:`, error);
        return {
            tokenId,
            isMinted: false,
            mintOwner: null,
            txId: null,
            blockTime: 'Not minted',
            timestamp: null,
            hash: null,
            error: true
        };
    }
}

// Process tokens in controlled parallel batches to avoid overwhelming the API
async function fetchAllTokensData(collection, maxTokens, onProgress) {
    const concurrency = 10; // Process 10 tokens in parallel at a time
    const results = new Array(maxTokens);
    let loaded = 0;

    for (let i = 0; i < maxTokens; i += concurrency) {
        const batchEnd = Math.min(i + concurrency, maxTokens);
        const batchPromises = [];

        for (let tokenId = i + 1; tokenId <= batchEnd; tokenId++) {
            batchPromises.push(fetchTokenData(collection, tokenId));
        }

        const batchResults = await Promise.all(batchPromises);
        for (const result of batchResults) {
            results[result.tokenId - 1] = result;
            loaded++;
        }

        if (onProgress) {
            onProgress(loaded, maxTokens);
        }
    }

    return results;
}

async function populateNFTTable(collection, maxTokens, mintedCount) {
    const tableBody = document.getElementById('nft-table-body');

    if (!tableBody) {
        return;
    }

    // Show loading indicator
    showLoadingIndicator(tableBody, `Loading NFT data... 0/${maxTokens}`);

    // Fetch ALL token data in parallel batches
    const allTokensData = await fetchAllTokensData(collection, maxTokens, updateLoadingProgress);

    // Store in cache for reuse by updateLastMintHash
    nftDataCache = {
        collection,
        tokens: allTokensData
    };

    // Build ALL rows at once using DocumentFragment for performance
    const fragment = document.createDocumentFragment();

    for (const data of allTokensData) {
        const row = document.createElement('tr');
        row.setAttribute('data-token-id', data.tokenId);

        if (data.error) {
            row.innerHTML = `
                <td>${data.tokenId}</td>
                <td><a href="https://kaspa.com/nft/collections/${collection}" target="_blank">Get your NFT ticket here and join the draw!</a></td>
                <td>Not minted</td>
                <td>Not minted</td>
                <td>Not minted</td>
                <td>No Prize</td>
            `;
        } else {
            row.innerHTML = `
                <td>${data.tokenId}</td>
                <td>${data.mintOwner}</td>
                <td>${data.isMinted ? 'Minted' : 'Not minted'}</td>
                <td>${data.txId ? `<a href="https://explorer.kaspa.org/txs/${data.txId}" target="_blank">${data.txId.substring(0, 8)}...</a>` : 'Not minted'}</td>
                <td>${data.blockTime}</td>
                <td>No Prize</td>
            `;
        }

        fragment.appendChild(row);
    }

    // Clear loading and inject all rows at once
    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);

    // Update last mint hash using cached data (no extra API calls!)
    updateLastMintHash(collection, maxTokens, mintedCount);

    // After all NFTs are populated, update prize status
    updatePrizeStatus();
}

// New function to update prize transaction status based on winners
function updatePrizeStatus() {
    const hashContainer = document.getElementById('hash-number-container');
    const winningNumberText = hashContainer.textContent;

    // Check if we have a winning number
    if (winningNumberText.includes('Winning number is')) {
        // Extract winning number
        const winningNumber = parseInt(winningNumberText.match(/\d+/)[0]);
        const rows = document.querySelectorAll('#nft-table-body tr');

        // Dynamic segment calculation
        const segment = getWinningSegment(winningNumber);
        if (!segment) return;

        // Update each row
        rows.forEach(row => {
            const tokenId = parseInt(row.getAttribute('data-token-id'));
            const prizeCell = row.cells[5]; // 6th column is Prize Transaction

            if (tokenId === winningNumber) {
                prizeCell.textContent = 'Transaction Pending';
            } else if (tokenId >= segment.start && tokenId <= segment.end) {
                prizeCell.textContent = 'Transaction Pending';
            } else {
                prizeCell.textContent = 'No Prize';
            }
        });
    }
}

// Dynamic segment calculation instead of hardcoded if/else chains
function getWinningSegment(winningNumber, segmentSize = 20) {
    if (winningNumber < 1) return null;
    const segmentIndex = Math.ceil(winningNumber / segmentSize);
    return {
        start: (segmentIndex - 1) * segmentSize + 1,
        end: segmentIndex * segmentSize
    };
}

async function updateLastMintHash(collection, maxTokens, mintedCount) {
    const hashContainer = document.getElementById('last-mint-hash-container');
    const numberContainer = document.getElementById('hash-number-container');
    const winnersContainer = document.getElementById('winners-info-container');
    const mintLinkContainer = document.getElementById('mint-link-container');
    const lastMintTxLink = document.getElementById('last-mint-transaction-link');

    if (mintedCount < maxTokens) {
        hashContainer.textContent = 'Last mint hash will be available when all NFTs are minted';
        numberContainer.textContent = 'The Winning number will be available when all NFTs are minted';
        winnersContainer.textContent = 'Winners information will be available when all NFTs are minted';
        mintLinkContainer.innerHTML = '';
        if (lastMintTxLink) {
            lastMintTxLink.removeAttribute('href');
        }
        return;
    }

    try {
        // Use cached data from populateNFTTable instead of making new API calls!
        const cachedTokens = nftDataCache.tokens || [];

        // Collect all minted transactions with their dates from cache
        const mintedNFTs = cachedTokens
            .filter(t => t && t.txId && t.timestamp && t.hash)
            .map(t => ({
                txId: t.txId,
                timestamp: t.timestamp,
                hash: t.hash
            }));

        if (mintedNFTs.length === 0) {
            hashContainer.textContent = 'No mint data available';
            numberContainer.textContent = 'Cannot determine winning number';
            winnersContainer.textContent = 'Cannot determine winners';
            return;
        }

        // Find the most recent transaction
        const lastMinted = mintedNFTs.sort((a, b) => b.timestamp - a.timestamp)[0];
        hashContainer.textContent = `Last mint hash: ${lastMinted.hash}`;

        // Format the hash with the first two digits in bold
        const hash = lastMinted.hash;
        const hashNumbers = hash.match(/\d/g) || [];
        if (hashNumbers.length >= 2) {
            let formattedHash = hash;
            let numbersFound = 0;

            formattedHash = hash.replace(/\d/g, (digit) => {
                if (numbersFound < 2) {
                    numbersFound++;
                    return `<strong>${digit}</strong>`;
                }
                return digit;
            });

            mintLinkContainer.innerHTML = `<p>Last Mint Transaction Hash for winner determination: ${formattedHash}</p>`;

            const firstTwoNumbers = hashNumbers.slice(0, 2).join('');
            const winningNumber = parseInt(firstTwoNumbers);
            numberContainer.textContent = `The Winning number is ${firstTwoNumbers}`;

            // Calculate winners information
            const winnersInfo = calculateWinners(winningNumber, maxTokens, collection);
            winnersContainer.innerHTML = winnersInfo;
        } else {
            mintLinkContainer.innerHTML = '<p>Not enough numbers in hash</p>';
            numberContainer.textContent = 'Not enough numbers in hash';
            winnersContainer.textContent = 'Cannot determine winners';
        }

        // Update link to the transaction where this hash was found
        if (lastMintTxLink && lastMinted.txId) {
            lastMintTxLink.href = `https://explorer.kaspa.org/txs/${lastMinted.txId}`;
        }

    } catch (error) {
        console.error('Error getting last mint hash:', error);
        hashContainer.textContent = 'Error loading hash';
        numberContainer.textContent = 'Error loading hash number';
        winnersContainer.textContent = 'Error loading winners information';
        mintLinkContainer.innerHTML = '<p>Error loading hash</p>';
        if (lastMintTxLink) {
            lastMintTxLink.removeAttribute('href');
        }
    }
}

function calculateWinners(winningNumber, maxTokens, collectionName) {
    // Dynamic segment calculation
    const segment = getWinningSegment(winningNumber);

    if (!segment) {
        return '<p>Winning number out of range</p>';
    }

    const segmentStart = segment.start;
    const segmentEnd = Math.min(segment.end, maxTokens);

    // Generate the list of NFTs in the segment (excluding the main winner)
    const doubleWinners = [];
    for (let i = segmentStart; i <= segmentEnd; i++) {
        if (i !== winningNumber && i <= maxTokens) {
            doubleWinners.push(i);
        }
    }

    let html = `
        <div style="margin: 20px 0; padding: 15px; border: 2px solid #01E4BA; background-color: #f9f9f9;">
            <h3 style="color: #000000; margin-top: 0;">Winner Announcement</h3>
            <p style="color: #000000;"><strong>NFT Draw : </strong><strong>${collectionName}</strong></p>
            <p style="color: #000000;"><strong>Winning Segment:</strong> ${segmentStart}–${segmentEnd}</p>
            <p style="color: #000000;"><strong>🥇 Grand Prize Winner:</strong> NFT #${winningNumber} → 8,400 KAS</p>
    `;

    if (doubleWinners.length > 0) {
        html += `<p style="color: #000000;"><strong>🥈 Double Winners:</strong> NFTs ${doubleWinners.join(', ')} → 400 KAS each</p>`;
    }

    // Calculate NFTs with no prize
    const noPrizeRanges = [];
    if (segmentStart > 1) {
        noPrizeRanges.push(`01–${segmentStart - 1}`);
    }
    if (segmentEnd < maxTokens) {
        noPrizeRanges.push(`${segmentEnd + 1}–${maxTokens}`);
    }

    if (noPrizeRanges.length > 0) {
        html += `<p style="color: #000000;"><strong>❌ No Prize:</strong> NFTs ${noPrizeRanges.join(' and ')}</p>`;
    }

    html += '</div>';

    return html;
}

let sortDirection = 'asc';

function sortTableByBlockTime() {
    const table = document.getElementById('nft-details');
    const header = table.querySelector('th.sortable');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    // Remove previous sort classes
    header.classList.remove('asc', 'desc');

    // Toggle sort direction
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    header.classList.add(sortDirection);

    // Sort rows
    rows.sort((a, b) => {
        const aValue = a.cells[4].textContent;
        const bValue = b.cells[4].textContent;

        // Handle special cases
        if (aValue === 'Not minted') return sortDirection === 'asc' ? 1 : -1;
        if (bValue === 'Not minted') return sortDirection === 'asc' ? -1 : 1;
        if (aValue === 'Error') return sortDirection === 'asc' ? 1 : -1;
        if (bValue === 'Error') return sortDirection === 'asc' ? -1 : 1;

        // Convert dates to timestamps for comparison
        const dateA = new Date(aValue).getTime();
        const dateB = new Date(bValue).getTime();

        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Update table
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

// Modify the function that updates the NFT count
function updateNFTCount(minted, max) {
    // Show elements only when all NFTs are minted - check if elements exist first
    const lastMintTransactionContainer = document.getElementById('last-mint-transaction-container');
    const winnersInfoContainer = document.getElementById('winners-info-container');
    const mintLinkContainer = document.getElementById('mint-link-container');

    if (minted >= max) {
        if (lastMintTransactionContainer) lastMintTransactionContainer.style.display = 'block';
        if (winnersInfoContainer) winnersInfoContainer.style.display = 'block';
        if (mintLinkContainer) mintLinkContainer.style.display = 'block';
    } else {
        if (lastMintTransactionContainer) lastMintTransactionContainer.style.display = 'none';
        if (winnersInfoContainer) winnersInfoContainer.style.display = 'none';
        if (mintLinkContainer) mintLinkContainer.style.display = 'none';
    }
}