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

import com.ebay.sdk.*;
import com.ebay.soap.eBLBaseComponents.*;
/**
 * Wrapper class of the GetOrderTransactions call of eBay SOAP API.
 * <br>
 * <p>Title: SOAP API wrapper library.</p>
 * <p>Description: Contains wrapper classes for eBay SOAP APIs.</p>
 * <p>Copyright: Copyright (c) 2009</p>
 * <p>Company: eBay Inc.</p>
 * <br> <B>Input property:</B> <code>ItemTransactionIDArray</code> - An array of ItemTransactionIDs.
 * <br> <B>Input property:</B> <code>OrderIDArray</code> - An array of OrderIDs. You can specify, at most, twenty OrderIDs.
 * <br> <B>Input property:</B> <code>Platform</code> - Name of the eBay co-branded site upon which the transaction was made.
 * This will serve as a filter for the transactions to get emitted in the response.
 * <br> <B>Input property:</B> <code>IncludeFinalValueFees</code> - Indicates whether to include Final Value Fee (FVF) in the response. For most
 * listing types, the Final Value Fee is returned in Transaction.FinalValueFee.
 * The Final Value Fee is returned on a transaction-by-transaction basis for
 * FixedPriceItem and StoresFixedPrice listing types. For all other listing
 * types, the Final Value Fee is returned when the listing status is Completed.
 * This value is not returned if the auction ended with Buy It Now.
 * <br><br>
 * For Dutch Buy It Now listings, the Final Value Fee is returned on a
 * transaction-by-transaction basis.
 * <br><br>
 * <span class="tablenote"><strong>Note:</strong>
 * As of version 619, Dutch-style (multi-item) competitive-bid auctions are deprecated.
 * eBay throws an error if you submit a Dutch item listing with AddItem
 * or VerifyAddItem. If you use RelistItem to update a Dutch auction listing,
 * eBay generates a warning and resets the Quantity value to 1.
 * </span>
 * <br>
 * <br> <B>Output property:</B> <code>ReturnedOrderArray</code> - An array of Orders.
 * 
 * @author Ron Murphy
 * @version 1.0
 */

public class GetOrderTransactionsCall extends com.ebay.sdk.ApiCall
{
  
  private ItemTransactionIDArrayType itemTransactionIDArray = null;
  private OrderIDArrayType orderIDArray = null;
  private TransactionPlatformCodeType platform = null;
  private Boolean includeFinalValueFees = null;
  private OrderArrayType returnedOrderArray=null;


  /**
   * Constructor.
   */
  public GetOrderTransactionsCall() {
  }

  /**
   * Constructor.
   * @param apiContext The ApiContext object to be used to make the call.
   */
  public GetOrderTransactionsCall(ApiContext apiContext) {
    super(apiContext);
    

  }

  /**
   * Retrieves information about one or more orders, or one or more transactions
   * (or both).
   * 
   * <br>
   * @throws ApiException
   * @throws SdkException
   * @throws Exception
   * @return The OrderArrayType object.
   */
  public OrderArrayType getOrderTransactions()
      throws com.ebay.sdk.ApiException, com.ebay.sdk.SdkException, java.lang.Exception
  {
    GetOrderTransactionsRequestType req;
    req = new GetOrderTransactionsRequestType();
    if (this.itemTransactionIDArray != null)
      req.setItemTransactionIDArray(this.itemTransactionIDArray);
    if (this.orderIDArray != null)
      req.setOrderIDArray(this.orderIDArray);
    if (this.platform != null)
      req.setPlatform(this.platform);
    if (this.includeFinalValueFees != null)
      req.setIncludeFinalValueFees(this.includeFinalValueFees);

    GetOrderTransactionsResponseType resp = (GetOrderTransactionsResponseType) execute(req);

    this.returnedOrderArray = resp.getOrderArray();
    return this.getReturnedOrderArray();
  }

  /**
   * Gets the GetOrderTransactionsRequestType.includeFinalValueFees.
   * @return Boolean
   */
  public Boolean getIncludeFinalValueFees()
  {
    return this.includeFinalValueFees;
  }

  /**
   * Sets the GetOrderTransactionsRequestType.includeFinalValueFees.
   * @param includeFinalValueFees Boolean
   */
  public void setIncludeFinalValueFees(Boolean includeFinalValueFees)
  {
    this.includeFinalValueFees = includeFinalValueFees;
  }

  /**
   * Gets the GetOrderTransactionsRequestType.itemTransactionIDArray.
   * @return ItemTransactionIDArrayType
   */
  public ItemTransactionIDArrayType getItemTransactionIDArray()
  {
    return this.itemTransactionIDArray;
  }

  /**
   * Sets the GetOrderTransactionsRequestType.itemTransactionIDArray.
   * @param itemTransactionIDArray ItemTransactionIDArrayType
   */
  public void setItemTransactionIDArray(ItemTransactionIDArrayType itemTransactionIDArray)
  {
    this.itemTransactionIDArray = itemTransactionIDArray;
  }

  /**
   * Gets the GetOrderTransactionsRequestType.orderIDArray.
   * @return OrderIDArrayType
   */
  public OrderIDArrayType getOrderIDArray()
  {
    return this.orderIDArray;
  }

  /**
   * Sets the GetOrderTransactionsRequestType.orderIDArray.
   * @param orderIDArray OrderIDArrayType
   */
  public void setOrderIDArray(OrderIDArrayType orderIDArray)
  {
    this.orderIDArray = orderIDArray;
  }

  /**
   * Gets the GetOrderTransactionsRequestType.platform.
   * @return TransactionPlatformCodeType
   */
  public TransactionPlatformCodeType getPlatform()
  {
    return this.platform;
  }

  /**
   * Sets the GetOrderTransactionsRequestType.platform.
   * @param platform TransactionPlatformCodeType
   */
  public void setPlatform(TransactionPlatformCodeType platform)
  {
    this.platform = platform;
  }

  /**
   * Valid after executing the API.
   * Gets the returned GetOrderTransactionsResponseType.returnedOrderArray.
   * 
   * @return OrderArrayType
   */
  public OrderArrayType getReturnedOrderArray()
  {
    return this.returnedOrderArray;
  }

}

