# How Multiviewer Capture Works

## Overview
Capturing multiple players from a single capture card is a highly efficient way to run tournaments, qualifiers, or restream events. This reduces the processing load on your browser by parsing multiple game feeds from one unified video source. Nestrischamps natively supports **2x2 (4 players)**, **3x2 (6 players)**, and **4x2 (8 players)** grid configurations.

---

## Equipment Needed
To run a hardware multiviewer setup, you will typically need:
1. **AV to HDMI Converters**: If capturing original NES consoles, you need one RCA-to-HDMI active upscaler per console (e.g., generic AV2HDMI boxes).
2. **HDMI Multiviewer**: A device that takes multiple HDMI inputs and outputs them in a single HDMI output grid. Standard 4x1 HDMI multiviewers support 2x2 grids. *(Search Amazon/Shopee for "4x1 HDMI Multiviewer").*
3. **HDMI Capture Card**: A capture card capable of receiving the multiviewer's output at 1080p60 and passing it to your PC via USB (e.g., Elgato Cam Link, Genki ShadowCast, or generic USB 3.0 HDMI capture dongles).

---

## How the System Works
The multiviewer mode simplifies setup by allowing you to align and calibrate just **one** player (the top-left one). The system then automatically computes and applies the same offsets to the other players, dividing the video feed equally based on your chosen layout.

### Setup Steps:
1. **Start the Producer**: Open your producer capture page.
2. **Select Multiviewer Mode**: Choose the appropriate grid size (2x2, 3x2, or 4x2) in the setup Wizard. Choose your capture device.
3. **Calibrate**: Start a game at level 0 on the console shown in the **TOP-LEFT** quadrant. Click somewhere black in that player's Tetris field to auto-calibrate. The system will extrapolate the coordinates for all other players in the grid automatically.
4. **Connect**: The system internally creates individual players and connects them to the central match database simultaneously.

---

## Capturing Concurrent Multiviewers
By default, a multiviewer capture assigns the players starting from "Player 1" (e.g., P1, P2, P3, P4). 
If you are running multiple capture instances (or using multiple PCs) to cover more players, you can specify the starting player number by appending the `?first_player={num}` parameter to your producer URL.

For example, for two 2x2 multiviewer setups:
- **Players 1 to 4** (Capture Card 1): `http://localhost:3000/producer?first_player=1` (or simply omit the parameter)
- **Players 5 to 8** (Capture Card 2): `http://localhost:3000/producer?first_player=5`

*Note: You would open each URL in a separate browser tab or window, assigning their respective capture cards to each.*

---

## Using OBS Virtual Camera
If you want to use individual USB capture cards for each player but still take advantage of the multiviewer system for reduced browser load and easier database coordination, you can construct the grid in OBS and route it into Nestrischamps via the **OBS Virtual Camera**:

1. Bring all your individual captures into OBS.
2. Arrange them in a clean grid (e.g., 2x2) ensuring they fill the entire OBS canvas proportionately (e.g., a 1920x1080 canvas).
3. Start the **OBS Virtual Camera** in OBS.
4. Open the Nestrischamps producer wizard, select **"OBS Virtual Camera"** as your capture device, and choose the corresponding multiviewer layout option.
5. Calibrate via the top-left capture as usual.

*(Note: OBS allows you to construct massive 4x2 or 3x2 multi-captures on custom-sized wider canvases, so ensure your OBS video output resolution matches the expected aspect ratio of the target grid!)*

---

## Practical Advice for Live Events
- **USB Bandwidth**: If using multiple USB capture cards (especially for the OBS Virtual Camera routing method), make sure they are distributed across different USB root hubs/controllers on your PC. Bottlenecking a single hub will cause frame drops or device freezing.
- **Framerate Consistency**: Ensure the multiviewer hardware and capture card are outputting consistent framerates. Hardware multiviewers can sometimes stutter; setting the producer to expect 30fps instead of 60fps can stabilize the OCR if you experience dropped frames.
