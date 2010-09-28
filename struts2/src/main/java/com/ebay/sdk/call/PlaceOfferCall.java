/*
Copyright (c) 2009 eBay, Inc.

This program is licensed under the terms of the eBay Common Development and 
Distribution License (CDDL) Version 1.0 (the "License") and any subsequent 
version thereof released by eBay.  The then-current version of the License 
can be found at https://www.codebase.ebay.com/Licenses.html and in the 
eBaySDKLicense file that is under the eBay SDK install directory.
*/

package com.ebay.sdk.call;

import java.lang.Boolean;
import java.lang.String;

import com.ebay.sdk.*;
import com.ebay.soap.eBLBaseComponents.*;
/**
 * Wrapper class of the PlaceOffer call of eBay SOAP API.
 * <br>
 * <p>Title: SOAP API wrapper library.</p>
 * <p>Description: Contains wrapper classes for eBay SOAP APIs.</p>
 * <p>Copyright: Copyright (c) 2009</p>
 * <p>Company: eBay Inc.</p>
 * <br> <B>Input property:</B> <code>Offer</code> - Specifies the type of offer being made. If the item is a
 * competitive-bidding listing, the offer is a bid. If the item is a
 * fixed-price listing, then the offer purchases the item. If the item is a
 * competitive-bidding listing and the offer is of type with an active,
 * unexercised Buy It Now option, then the offer can either purchase the
 * item or be a bid. See the schema documentation for OfferType for details
 * on its properties and their meanings.
 * <br> <B>Input property:</B> <code>ItemID</code> - Unique item ID that identifies the item listing for which the action is being
 * submitted.
 * <br><br>
 * If the item was listed with Variations, you must also specify
 * VariationSpecifics in the request to uniquely identify the
 * variant being purchased.
 * <br> <B>Input property:</B> <code>BlockOnWarning</code> - If a warning message exists and BlockOnWarning is true,
 * the warning message is returned and the bid is blocked. If no warning message
 * exists and BlockOnWarning is true, the bid is placed. If BlockOnWarning
 * is false, the bid is placed, regardless of warning.
 * <br> <B>Input property:</B> <code>AffiliateTrackingDetails</code> - Container for affiliate-related tags, which enable the tracking of user
 * activity. If you include AffiliateTrackingDetails in your PlaceOffer call, then
 * it is possible to receive affiliate commissions based on calls made by your
 * application. (See the <a href=
 * "http://www.ebaypartnernetwork.com/" target="_blank">eBay Partner Network</a>
 * for information about commissions.) Please note that affiliate tracking is not
 * available in the Sandbox environment, and that affiliate tracking is not
 * available when you make a best offer.
 * <br> <B>Input property:</B> <code>VariationSpecifics</code> - Name-value pairs that identify a single variation within the
 * listing identified by ItemID. Required when the seller
 * listed the item with Item Variations.<br>
 * <br>
 * If you want to buy items from multiple variations in the same
 * listing, use a separate PlaceOffer request for each variation.
 * For example, if you want to buy 3 red shirts and 2 black shirts
 * from the same listing, use one PlaceOffer request for the
 * 3 red shirts, and another PlaceOffer request for the 2
 * black shirts.
 * <br> <B>Output property:</B> <code>ReturnedSellingStatus</code> - Indicates the current bidding/purchase state of the item listing, as of
 * the offer extended using PlaceOffer. See the schema documentation for
 * the SellingStatus object, the properties of which contain such
 * post-offer information as the current high bidder, the current price for
 * the item, and the bid increment.
 * <br> <B>Output property:</B> <code>ReturnedTransactionID</code> - The TransactionID field can be returned if, on input, you specified Purchase in the Action field. 
 * The TransactionID field contains the ID of the transaction created.
 * This field applies to the following types of listings:
 * FixedPriceItem and StoresFixedPrice. This field also applies to Chinese BIN 
 * if you specified Purchase on input.
 * <br> <B>Output property:</B> <code>ReturnedBestOffer</code> - For a best-offer-related action of a buyer using PlaceOffer, 
 * contains information about the best-offer-related action.
 * 
 * @author Ron Murphy
 * @version 1.0
 */

public class PlaceOfferCall extends com.ebay.sdk.ApiCall
{
  
  private OfferType offer = null;
  private String itemID = null;
  private Boolean blockOnWarning = null;
  private AffiliateTrackingDetailsType affiliateTrackingDetails = null;
  private NameValueListArrayType variationSpecifics = null;
  private SellingStatusType returnedSellingStatus=null;
  private String returnedTransactionID=null;
  private BestOfferType returnedBestOffer=null;


  /**
   * Constructor.
   */
  public PlaceOfferCall() {
  }

  /**
   * Constructor.
   * @param apiContext The ApiContext object to be used to make the call.
   */
  public PlaceOfferCall(ApiContext apiContext) {
    super(apiContext);
    

  }

  /**
   * Enables the authenticated user to to make a bid, a best offer, or
   * a purchase on the item specified by the ItemID input field.
   * 
   * <br>
   * @throws ApiException
   * @throws SdkException
   * @throws Exception
   * @return The SellingStatusType object.
   */
  public SellingStatusType placeOffer()
      throws com.ebay.sdk.ApiException, com.ebay.sdk.SdkException, java.lang.Exception
  {
    PlaceOfferRequestType req;
    req = new PlaceOfferRequestType();
    if (this.offer != null)
      req.setOffer(this.offer);
    if (this.itemID != null)
      req.setItemID(this.itemID);
    if (this.blockOnWarning != null)
      req.setBlockOnWarning(this.blockOnWarning);
    if (this.affiliateTrackingDetails != null)
      req.setAffiliateTrackingDetails(this.affiliateTrackingDetails);
    if (this.variationSpecifics != null)
      req.setVariationSpecifics(this.variationSpecifics);

    PlaceOfferResponseType resp = (PlaceOfferResponseType) execute(req);

    this.returnedSellingStatus = resp.getSellingStatus();
    this.returnedTransactionID = resp.getTransactionID();
    this.returnedBestOffer = resp.getBestOffer();
    return this.getReturnedSellingStatus();
  }

  /**
   * Gets the PlaceOfferRequestType.affiliateTrackingDetails.
   * @return AffiliateTrackingDetailsType
   */
  public AffiliateTrackingDetailsType getAffiliateTrackingDetails()
  {
    return this.affiliateTrackingDetails;
  }

  /**
   * Sets the PlaceOfferRequestType.affiliateTrackingDetails.
   * @param affiliateTrackingDetails AffiliateTrackingDetailsType
   */
  public void setAffiliateTrackingDetails(AffiliateTrackingDetailsType affiliateTrackingDetails)
  {
    this.affiliateTrackingDetails = affiliateTrackingDetails;
  }

  /**
   * Gets the PlaceOfferRequestType.blockOnWarning.
   * @return Boolean
   */
  public Boolean getBlockOnWarning()
  {
    return this.blockOnWarning;
  }

  /**
   * Sets the PlaceOfferRequestType.blockOnWarning.
   * @param blockOnWarning Boolean
   */
  public void setBlockOnWarning(Boolean blockOnWarning)
  {
    this.blockOnWarning = blockOnWarning;
  }

  /**
   * Gets the PlaceOfferRequestType.itemID.
   * @return String
   */
  public String getItemID()
  {
    return this.itemID;
  }

  /**
   * Sets the PlaceOfferRequestType.itemID.
   * @param itemID String
   */
  public void setItemID(String itemID)
  {
    this.itemID = itemID;
  }

  /**
   * Gets the PlaceOfferRequestType.offer.
   * @return OfferType
   */
  public OfferType getOffer()
  {
    return this.offer;
  }

  /**
   * Sets the PlaceOfferRequestType.offer.
   * @param offer OfferType
   */
  public void setOffer(OfferType offer)
  {
    this.offer = offer;
  }

  /**
   * Gets the PlaceOfferRequestType.variationSpecifics.
   * @return NameValueListArrayType
   */
  public NameValueListArrayType getVariationSpecifics()
  {
    return this.variationSpecifics;
  }

  /**
   * Sets the PlaceOfferRequestType.variationSpecifics.
   * @param variationSpecifics NameValueListArrayType
   */
  public void setVariationSpecifics(NameValueListArrayType variationSpecifics)
  {
    this.variationSpecifics = variationSpecifics;
  }

  /**
   * Valid after executing the API.
   * Gets the returned PlaceOfferResponseType.returnedBestOffer.
   * 
   * @return BestOfferType
   */
  public BestOfferType getReturnedBestOffer()
  {
    return this.returnedBestOffer;
  }

  /**
   * Valid after executing the API.
   * Gets the returned PlaceOfferResponseType.returnedSellingStatus.
   * 
   * @return SellingStatusType
   */
  public SellingStatusType getReturnedSellingStatus()
  {
    return this.returnedSellingStatus;
  }

  /**
   * Valid after executing the API.
   * Gets the returned PlaceOfferResponseType.returnedTransactionID.
   * 
   * @return String
   */
  public String getReturnedTransactionID()
  {
    return this.returnedTransactionID;
  }

}

