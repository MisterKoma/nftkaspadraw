function searchNFTCollection() {
    const nftCollection = document.getElementById('nft-collection').value.trim();
    
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

                // After updating the general information, populate the table
                populateNFTTable(nftCollection, data.result.max);
                updateLastMintHash(nftCollection, data.result.max, data.result.minted);
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
document.getElementById('nft-collection').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        searchNFTCollection();
    }
});

// Add event listener for dropdown change
document.getElementById('nft-collection').addEventListener('change', function(event) {
    searchNFTCollection();
});

// Load default collection on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting search...');
    const table = document.getElementById('nft-details');
    console.log('Table element:', table);
    const tbody = document.getElementById('nft-table-body');
    console.log('Table body element:', tbody);
    
    searchNFTCollection();
});

function clearNFTTable() {
    const tbody = document.getElementById('nft-table-body');
    console.log('Clearing table, tbody:', tbody);
    if (tbody) {
        tbody.innerHTML = '';
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            if (i === retries - 1) throw error;
            await sleep(100); // Wait 0.1 second before retrying
        }
    }
}

async function populateNFTTable(collection, maxTokens) {
    console.log('Populating table for collection:', collection, 'maxTokens:', maxTokens);
    const tableBody = document.getElementById('nft-table-body');
    console.log('Table body for population:', tableBody);
    
    if (!tableBody) {
        console.error('Table body not found!');
        return;
    }
    
    tableBody.innerHTML = '';
    const batchSize = 20; // Increased from 5 to 20
    
    for (let startId = 1; startId <= maxTokens; startId += batchSize) {
        const endId = Math.min(startId + batchSize - 1, maxTokens);
        const rows = [];
        
        // Create all rows first
        for (let tokenId = startId; tokenId <= endId; tokenId++) {
            const row = document.createElement('tr');
            row.setAttribute('data-token-id', tokenId);
            row.innerHTML = `
                <td>${tokenId}</td>
                <td>Loading...</td>
                <td>Loading...</td>
                <td>Loading...</td>
                <td>Loading...</td>
                <td>Loading...</td>
            `;
            tableBody.appendChild(row);
            rows.push({ tokenId, row });
        }

        // Process each token in the batch
        for (const { tokenId, row } of rows) {
            try {
                const [tokenData, historyData] = await Promise.all([
                    fetchWithRetry(`https://mainnet.krc721.stream/api/v1/krc721/mainnet/nfts/${collection}/${tokenId}`),
                    fetchWithRetry(`https://mainnet.krc721.stream/api/v1/krc721/mainnet/history/${collection}/${tokenId}`)
                ]);

                const isMinted = tokenData.result && tokenData.result.owner;
                const txId = historyData?.result?.[0]?.txIdRev;
                const mintOwner = historyData?.result?.[0]?.owner || 'Not minted';

                let blockTime = 'Not minted';
                if (txId) {
                    const txData = await fetchWithRetry(`https://api.kaspa.org/transactions/${txId}`);
                    if (txData.block_time) {
                        const date = new Date(txData.block_time);
                        blockTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
                    }
                }

                row.innerHTML = `
                    <td>${tokenId}</td>
                    <td>${mintOwner}</td>
                    <td>${isMinted ? 'Minted' : 'Not minted'}</td>
                    <td>${txId ? `<a href="https://explorer.kaspa.org/txs/${txId}" target="_blank">${txId.substring(0, 8)}...</a>` : 'Not minted'}</td>
                    <td>${blockTime}</td>
                    <td>No Prize</td>
                `;
            } catch (error) {
                console.error(`Error processing token ${tokenId}:`, error);
                row.innerHTML = `
                    <td>${tokenId}</td>
                    <td><a href="https://kaspa.com/nft/collections/${collection}" target="_blank">Get your NFT ticket here and join the draw!</a></td>
                    <td>Not minted</td>
                    <td>Not minted</td>
                    <td>Not minted</td>
                    <td>No Prize</td>
                `;
            }
            
            await sleep(100); // Small delay between individual tokens
        }
        
        await sleep(200); // Small delay between batches (reduced from 300ms)
    }
    
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
        
        // Determine segment
        let segmentStart, segmentEnd;
        if (winningNumber >= 1 && winningNumber <= 20) {
            segmentStart = 1;
            segmentEnd = 20;
        } else if (winningNumber >= 21 && winningNumber <= 40) {
            segmentStart = 21;
            segmentEnd = 40;
        } else if (winningNumber >= 41 && winningNumber <= 60) {
            segmentStart = 41;
            segmentEnd = 60;
        } else if (winningNumber >= 61 && winningNumber <= 80) {
            segmentStart = 61;
            segmentEnd = 80;
        } else if (winningNumber >= 81 && winningNumber <= 100) {
            segmentStart = 81;
            segmentEnd = 100;
        }
        
        // Update each row
        rows.forEach(row => {
            const tokenId = parseInt(row.getAttribute('data-token-id'));
            const prizeCell = row.cells[5]; // 6th column is Prize Transaction
            
            if (tokenId === winningNumber) {
                // Grand prize winner
                prizeCell.textContent = 'Transaction Pending';
            } else if (tokenId >= segmentStart && tokenId <= segmentEnd) {
                // Double winners
                prizeCell.textContent = 'Transaction Pending';
            } else {
                // No prize
                prizeCell.textContent = 'No Prize';
            }
        });
    }
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
        // Collect all minted transactions with their dates
        const mintedNFTs = [];
        for (let tokenId = 1; tokenId <= maxTokens; tokenId++) {
            const historyData = await fetchWithRetry(`https://mainnet.krc721.stream/api/v1/krc721/mainnet/history/${collection}/${tokenId}`);
            if (historyData?.result?.[0]?.txIdRev) {
                const txData = await fetchWithRetry(`https://api.kaspa.org/transactions/${historyData.result[0].txIdRev}`);
                mintedNFTs.push({
                    txId: historyData.result[0].txIdRev,
                    timestamp: txData.block_time,
                    hash: txData.hash
                });
            }
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
            
            // Replace the first two digits with their bold version
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
    // Determine the winning segment (segments of 20)
    let segmentStart, segmentEnd;
    
    if (winningNumber >= 1 && winningNumber <= 20) {
        segmentStart = 1;
        segmentEnd = 20;
    } else if (winningNumber >= 21 && winningNumber <= 40) {
        segmentStart = 21;
        segmentEnd = 40;
    } else if (winningNumber >= 41 && winningNumber <= 60) {
        segmentStart = 41;
        segmentEnd = 60;
    } else if (winningNumber >= 61 && winningNumber <= 80) {
        segmentStart = 61;
        segmentEnd = 80;
    } else if (winningNumber >= 81 && winningNumber <= 100) {
        segmentStart = 81;
        segmentEnd = Math.min(100, maxTokens);
    } else {
        return '<p>Winning number out of range</p>';
    }
    
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