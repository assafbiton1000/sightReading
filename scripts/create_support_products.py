import time
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Must match src/utils/iap.ts and app.json exactly.
PACKAGE_NAME = 'com.freepacepiano.app'
KEY_FILE_PATH = 'google-service-account.json'
SCOPES = ['https://www.googleapis.com/auth/androidpublisher']

# Matches SUPPORT_MIN_AMOUNT / SUPPORT_MAX_AMOUNT in src/utils/iap.ts.
MIN_AMOUNT = 1
MAX_AMOUNT = 100

# Google retired the old inappproducts API for one-time products (it now
# rejects inserts with "Please migrate to the new publishing API") and removed
# Play Console CSV import in May 2025. This uses the current Monetization API:
# convertRegionPrices to get a tax-inclusive price per region for the given
# USD amount, then patch (upsert) the product, then activate its purchase
# option — a product's purchase option stays in DRAFT (unpurchasable) until
# explicitly activated.


def convert_prices(service, amount):
    response = service.monetization().convertRegionPrices(
        packageName=PACKAGE_NAME,
        body={"price": {"currencyCode": "USD", "units": str(amount)}},
    ).execute()
    region_configs = [
        {
            "regionCode": region_code,
            "price": converted["price"],
            "availability": "AVAILABLE",
        }
        for region_code, converted in response["convertedRegionPrices"].items()
    ]
    other_regions = response["convertedOtherRegionsPrice"]
    new_regions_config = {
        "usdPrice": other_regions["usdPrice"],
        "eurPrice": other_regions["eurPrice"],
        "availability": "AVAILABLE",
    }
    return region_configs, new_regions_config, response["regionVersion"]["version"]


def main():
    credentials = service_account.Credentials.from_service_account_file(
        KEY_FILE_PATH, scopes=SCOPES
    )
    service = build('androidpublisher', 'v3', credentials=credentials)

    for amount in range(MIN_AMOUNT, MAX_AMOUNT + 1):
        # Must be exactly this format — src/utils/iap.ts's supportProductId()
        # generates "support_<amount>" and looks up purchases by that exact id.
        product_id = f"support_{amount}"

        try:
            region_configs, new_regions_config, region_version = convert_prices(service, amount)

            product_body = {
                "packageName": PACKAGE_NAME,
                "productId": product_id,
                "listings": [
                    {
                        "languageCode": "en-US",
                        "title": f"Support — ${amount}",
                        "description": f"A ${amount} one-time donation to support FreePace Piano's development.",
                    },
                    {
                        "languageCode": "he-IL",
                        "title": f"תמיכה — ${amount}",
                        "description": f"תרומה חד-פעמית של ${amount} לתמיכה בפיתוח FreePace Piano.",
                    },
                ],
                "purchaseOptions": [
                    {
                        "purchaseOptionId": "buy",
                        "buyOption": {},
                        "regionalPricingAndAvailabilityConfigs": region_configs,
                        "newRegionsConfig": new_regions_config,
                    }
                ],
            }

            service.monetization().onetimeproducts().patch(
                packageName=PACKAGE_NAME,
                productId=product_id,
                regionsVersion_version=region_version,
                allowMissing=True,
                updateMask="listings,purchaseOptions",
                body=product_body,
            ).execute()

            service.monetization().onetimeproducts().purchaseOptions().batchUpdateStates(
                packageName=PACKAGE_NAME,
                productId=product_id,
                body={
                    "requests": [
                        {
                            "activatePurchaseOptionRequest": {
                                "packageName": PACKAGE_NAME,
                                "productId": product_id,
                                "purchaseOptionId": "buy",
                            }
                        }
                    ]
                },
            ).execute()

            print(f"Created + activated {product_id} (${amount})")
        except Exception as e:
            print(f"FAILED {product_id}: {e}")

        time.sleep(0.5)  # stay well under the API rate limit


if __name__ == '__main__':
    main()
