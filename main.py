import requests
import json
import xml.etree.ElementTree as ET


def fetch_pois(lat_min, lon_min, lat_max, lon_max):
    url = f"https://places.post.ch/StandortSuche/StaoCacheServiceV2/api/v1/Find"
    params = {
        "extent": f"{lon_min},{lat_min},{lon_max},{lat_max}",
        "clusterdist": 0,
        "query": "T12",
        "aggelevel": 0,
        "lod": 2,
        "lang": "en",
        "autoexpand": "true",
        "encoding": "UTF-8",
        "maxpois": 1000,
    }

    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch POIs: {response.status_code}")

    return response.json()

def fetch_poi_details(poi_id):
    url = "https://places.post.ch/StandortSuche/StaoCacheServiceV2/api/v1/Poi"
    params = {
        "id": poi_id,
    }

    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch POI details: {response.status_code}")

    response_json = parse_xml_to_json(response.text)
    return response_json

def parse_xml_to_json(xml_string):
    root = ET.fromstring(xml_string)

    product_deadlines = {}

    for product in root.findall("Product"):
        product_type_id = product.get("ProductTypeId")
        deadlines = {}

        for deadline in product.findall("Deadline"):
            day = int(deadline.find("Day").text)
            latest_time = deadline.find("LatestTime").text
            deadlines[day] = latest_time

        product_deadlines[product_type_id] = deadlines

    # make sure all days are present
    for product_type_id, deadlines in product_deadlines.items():
        for day in range(1, 8):
            if day not in deadlines:
                deadlines[day] = None

    result = {"product_deadlines": product_deadlines}
    return result


def subdivide_area(lat_min, lon_min, lat_max, lon_max, max_lat=0.04, max_lon=0.04):
    lat_diff = lat_max - lat_min
    lon_diff = lon_max - lon_min

    for lat in range(0, int(lat_diff // max_lat) + 1):
        for lon in range(0, int(lon_diff // max_lon) + 1):
            yield lat_min + lat * max_lat, lon_min + lon * max_lon, lat_min + (lat + 1) * max_lat, lon_min + (lon + 1) * max_lon


def fetch_persist_pois():
    # 47.331663, 8.361608 -- 47.536873, 8.836567

    # subdivisions = list(subdivide_area(47.331663, 8.361608, 47.536873, 8.836567))

    # all of switzerland
    subdivisions = list(subdivide_area(45.817920, 5.955975, 47.808464, 10.492294))

    print(f"Fetching for {len(subdivisions)} subdivisions")
    pois = []
    for i, (lat_min, lon_min, lat_max, lon_max) in enumerate(subdivisions):
        print(f"Fetching subdivision {i+1}/{len(subdivisions)}")
        result = fetch_pois(lat_min, lon_min, lat_max, lon_max)
        pois.extend(result["pois"])

    print(f"Fetching details for {len(pois)} POIs")
    for i, poi in enumerate(pois):
        print(f"Fetching details for POI {i+1}/{len(pois)}")
        poi_details = fetch_poi_details(poi["id"])
        poi.update(poi_details)

    with open("pois.json", "w") as f:
        json.dump(pois, f)

def main(fetch_pois=True):
    if fetch_pois:
        fetch_persist_pois()

    with open("pois.json", "r") as f:
        pois = json.load(f)

    print(f"Found {len(pois)} POIs")


if __name__ == "__main__":
    main()
