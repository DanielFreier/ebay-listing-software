<%@ page contentType="text/html; charset=UTF-8" %>
<%@ taglib uri="/struts-tags" prefix="s" %>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>ListersIn - <s:text name="eBayListingSoftware"/></title>
<link rel="shortcut icon" href="/img/favicon.png">

<link rel="stylesheet" type="text/css" href="/css/ebay.css">
<link rel="stylesheet" type="text/css" href="/js/jwysiwyg/jquery.wysiwyg.css">
<link rel="stylesheet" type="text/css" href="/js/redactor/redactor.css">
<link rel="stylesheet" type="text/css" href="/js/jquery-ui-1.10.1.custom/css/smoothness/jquery-ui-1.10.1.custom.min.css">
<link rel="stylesheet" type="text/css" href="/js/jquery-ui-timepicker-addon/jquery-ui-timepicker-addon.css">

<script type="text/javascript" src="/js/jquery-1.9.1.min.js"></script>
<script type="text/javascript" src="/js/jquery.dump.js"></script>
<script type="text/javascript" src="/js/redactor/redactor.min.js"></script>

<script type="text/javascript" src="/js/jquery.timers-1.2.js"></script>
<script type="text/javascript" src="/js/jquery.scrollTo-min.js"></script>
<script type="text/javascript" src="/js/jquery-ui-1.10.1.custom/js/jquery-ui-1.10.1.custom.min.js"></script>
<script type="text/javascript" src="/js/jquery-ui-timepicker-addon/jquery-ui-timepicker-addon.js"></script>

<script type="text/javascript" src="/js/ebay.js?2"></script>
<script type="text/javascript">
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-32099440-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
</script>

</head>
<body>

<div id="container">
  
  <div id="message"></div>
  
  <div id="leftpane">
    
    <div id="logo">
      <a href="/"><img src="/img/logo.png"/></a>
    </div>
    
    <button class="newitem"><s:text name="AddNewItem"/></button>
    
    <div id="toolbar">
      
      <ul class="accounts">
        <li class="allitems"><s:text name="AllItems"/></li>
        <li class="itemstatuses">
          <ul class="accountaction">
            <li class="scheduled" ><img src="/icon/02/10/37.png"/><s:text name="Scheduled" /></li>
            <li class="active"    ><img src="/icon/04/10/02.png"/><s:text name="Active"    /></li>
            <li class="sold"      ><img src="/icon/02/10/50.png"/><s:text name="Sold"      /></li>
            <li class="unsold"    ><img src="/icon/04/10/10.png"/><s:text name="Unsold"    /></li>
            <li class="unanswered"><img src="/icon/04/10/10.png"/><s:text name="Unanswered"/></li>
            <li class="saved"     ><img src="/icon/04/10/10.png"/><s:text name="Saved"     /></li>
          </ul>
        </li>
      </ul>
      
      <div id="filteroption">
        
        <a href="#" id="checkduplicateitems">Check duplicate items</a>
        
        <br/>
        <br/>
        
        <a href="http://forum.listers.in/" target="_blank"><s:text name="Forum"/></a>
        | <a href="http://listers.in/blog/" target="_blank"><s:text name="Blog"/></a>
        
        <br/>
        <br/>
        
        <a href="/?request_locale=en">English</a>
        | <a href="/?request_locale=ja">日本語</a>
        
        <br/>
        
      </div>
      
      <br/>
      
      <a href="#" id="calletsy">Etsy</a><br/>
      <a href="#" id="toggledebug">DEBUG</a><br/>
      <a href="#" id="showorders">orders</a><br/>
      
      <div id="log"></div>
      
      <div id="hiddenforms">
        
        <select name="selling" class="filter">
          <option value="allitems">All items</option>
          <option value="scheduled">Scheduled</option>
          <option value="active">Active</option>
          <option value="sold">Sold</option>
          <option value="unsold">Unsold</option>
          <option value="unanswered">Unanswered</option>
          <option value="saved">Saved</option>
        </select>
        
        <select name="UserID" class="filter">
          <option value="">All UserID</option>
        </select>
        
        <select name="sortfield" class="filter">
          <option value="mod.Quantity">Quantity</option>
          <option value="mod.StartPrice">Price</option>
          <option value="mod.Title">Title</option>
          <option value="org.ItemID">ItemID</option>
          <option value="org.WatchCount">Watch count</option>
          <option value="org.HitCount">Hit count</option>
          <option value="org.ListingDetails.EndTime">End time</option>
          <option value="org.SellingStatus.BidCount">Bid count</option>
          <option value="org.SellingStatus.QuantitySold">Sold count</option>
          <option value="UserID">UserID</option>
        </select>
        
        <select name="sortorder" class="filter">
          <option value="1">Ascending</option>
          <option value="-1">Descending</option>
        </select>
        
        <input type="text" class="filter" name="offset"    value="0"/>
        <input type="text" class="filter" name="limit"     value="30"/>
        <input type="text" class="filter" name="option"    value=""/>
        <input type="text" class="filter" name="allpages"  value=""/>
        
      </div>
      
      <iframe name="posttarget" src="/blank.html"></iframe>
      
    </div><!-- toolbar -->
    
  </div><!-- leftpane -->

  <div id="rightpane">
    
    <div id="header" class="clearfix">
      
      <div id="headerupper" class="clearfix">
        
        <div id="headersearchform" class="clearfix">
          <input id="filtertitle" type="text" class="filter" name="Title" 
                 placeholder="<s:text name="SearchItems"/>" />
          <select name="mod.ListingType" class="filter">
            <option value="">All Listing Type</option>
            <option value="Chinese">Online Auction</option>  
            <option value="FixedPriceItem">Fixed Price</option>
            <option value="StoresFixedPrice">Stores Fixed Price</option>
            <option value="LeadGeneration">Classified Ad</option>
          </select>
          <button class="btnright"><s:text name="Search"/></button>
        </div>
        
        <div id="headerupper_right">
          <div id="user_email">${user.email}</div>
          <div>
            <a href="#" id="showhelp"><s:text name="Help"/></a>
            | <a id="signout" href="/page/logout"><s:text name="SignOut"/></a>
          </div>
        </div>
        
      </div>
      
      <div id="bulkbuttons" class="clearfix">
        
        <button class="copy btnleft disabled"
                disabled="disabled"><s:text name="Copy"/></button>
        <button class="delete btnright disabled"
                disabled="disabled"><s:text name="Delete"/></button>
        
        <button class="add btnleft disabled" disabled="disabled"
                title="List checked items to eBay."><s:text name="List"/></button>
        <button class="relist btncenter disabled" disabled="disabled"
                title="Relist checked items to eBay."><s:text name="Relist"/></button>
        <button class="revise btncenter disabled" disabled="disabled"
                title="Revise checked items of eBay."><s:text name="Revise"/></button>
        <button class="verifyadditem btncenter disabled"
                disabled="disabled"><s:text name="Verify"/></button>
        <button class="end btnright disabled" disabled="disabled"
                title="End checked items on eBay."><s:text name="End"/></button>
        
        
      </div>
      
      <button id="settingsbutton"><s:text name="Settings"/></button>
      <div id="paging"></div>
      
    </div><!-- header -->
    
    <div id="content">
      
      <table id="items" class="items">
        <thead>
          <tr>
            <td colspan="4">
              <input type="checkbox" id="checkall" name="checkall" />
              <label for="checkall">Check all</label>
            </td>
            <td>
              <div class="title" data-field="mod.Title">
                Title<span class="arrow"></span>
              </div>
            </td>
            <td>
              <div class="ItemID" data-field="org.ItemID">
                ItemID<span class="arrow"></span>
              </div>
              <div class="UserID" data-field="UserID">
                UserID<span class="arrow"></span>
              </div>
            </td>
            <td>
              <div class="HitCount" data-field="org.HitCount">
                <span class="arrow"></span>Hit
              </div>
              <div class="WatchCount" data-field="org.WatchCount">
                <span class="arrow"></span>Wch
              </div>
            </td>
            <td>
              <div class="BidCount" data-field="org.SellingStatus.BidCount">
                <span class="arrow"></span>Bid
              </div>
              <div class="SoldCount" data-field="org.SellingStatus.QuantitySold">
                <span class="arrow"></span>Sold
              </div>
            </td>
            <td>
              <div class="Quantity" data-field="mod.Quantity">
                <span class="arrow"></span>Qty
              </div>
            </td>
            <td>
              <div class="StartPrice" data-field="mod.StartPrice">
                <span class="arrow"></span>Price
              </div>
            </td>
            <td>
              <div class="EndTime" data-field="org.ListingDetails.EndTime">
                <span class="arrow"></span>End
              </div>
            </td>
          </tr>
        </thead>
        <tbody id="rowtemplate" class="itemrow">
          <tr class="row1">
            <td>
              <input type="checkbox" name="id"/>
            </td>
            <td>
              <img class="status" src="/icon/04/10/10.png"/>
            </td>
            <td class="ListingType"></td>
            <td class="PictureURL">
              <div>
                <img class="PictureURL" src="/img/gray.png"/>
              </div>
            </td>
            <td class="Title"></td>
            <td>
              <div>
                <a href="#" class="ItemID" target="_blank"></a>
              </div>
              <div class="UserID"></div>
            </td>
            <td>
              <div class="HitCount">-</div>
              <div class="WatchCount">-</div>
            </td>
            <td>
              <div class="BidCount">-</div>
              <div class="SoldCount">-</div>
            </td>
            <td class="Quantity">-</td>
            <td>
              <div class="CurrentPrice"></div>
              <div class="StartPrice"></div>
            </td>
            <td>
              <div class="EndTime"></div>
              <div class="StartTime"></div>
            </td>
          </tr>
          <tr class="row2">
            <td colspan="11"></td>
          </tr>
        </tbody>
        <tbody id="rowloading">
          <tr>
            <td colspan="11" align="center">
              <s:text name="LoadingItemData"/>
            </td>
          </tr>
        </tbody>
      </table><!-- #items -->
      
      <table id="orders">
        <thead>
          <tr>
          </tr>
        </thead>
        <tbody>
          <tr id="orderrowtemplate">
            <td class="OrderStatus"></td>
            <td class="Title"></td>
            <td>
              <div>
                <a href="#" class="ItemID" target="_blank"></a>
              </div>
              <div class="UserID"></div>
            </td>
            <td class="BuyerUserID"></td>
            <td class="QuantityPurchased"></td>
            <td class="Total"></td>
            <td class="CreatedTime"></td>
            <td></td>
          </tr>
        </tbody>
      </table><!-- #orders -->
      
      <div id="settings">
        <table class="detail">
          <tbody>
            <tr>
              <th><s:text name="Email"/></th>
              <td>
                <div id="settings-email"></div>
              </td>
            </tr>
            <tr>
              <th>Status</th>
              <td>
                <div id="settings-status"></div>
              </td>
            </tr>
            <tr>
              <th>Time zone</th>
              <td>
<select name="TimeZone">
  <option value="GMT-12:00">UTC -12:00 (Eniwetok, Kwajalein)</option>
  <option value="GMT-11:00">UTC -11:00 (Midway Island, Samoa)</option>
  <option value="GMT-10:00">UTC -10:00 (Hawaii)</option>
  <option value="GMT-09:00">UTC -09:00 (Alaska)</option>
  <option value="GMT-08:00">UTC -08:00 (Pacific Time - US &amp; Canada; Tijuana)</option>
  <option value="GMT-07:00">UTC -07:00 (Mountain Time - US &amp; Canada)</option>
  <option value="GMT-06:00">UTC -06:00 (Central Time; Central America; Mexico City)</option>
  <option value="GMT-05:00">UTC -05:00 (Eastern Time - US &amp; Canada; Bogota, Lima)</option>
  <option value="GMT-04:00">UTC -04:00 (Atlantic Time - Canada; Caracas, Santiago)</option>
  <option value="GMT-03:00">UTC -03:00 (Greenland, Buenos Aires, Brasilia)</option>
  <option value="GMT-02:00">UTC -02:00 (Mid-Atlantic)</option>
  <option value="GMT-01:00">UTC -01:00 (Azores, Cape Verde Is.)</option>
  <option value="GMT+00:00">UTC -00:00 (GMT, London, Dublin, Casablanca, Edinburgh)</option>
  <option value="GMT+01:00">UTC +01:00 (Rome, Berlin, Paris, Amsterdam, Stockholm)</option>
  <option value="GMT+02:00">UTC +02:00 (Athens, Helsinki, Cairo)</option>
  <option value="GMT+03:00">UTC +03:00 (Moscow, Nairobi, Kuwait)</option>
  <option value="GMT+04:00">UTC +04:00 (Baku, Abu Dhabi, Tbilisi)</option>
  <option value="GMT+05:00">UTC +05:00 (Karachi, Islamabad, )</option>
  <option value="GMT+06:00">UTC +06:00 (Astana, Sri Jayawardenepura)</option>
  <option value="GMT+07:00">UTC +07:00 (Bangkok, Hanoi, Jakarta, Krasnoyarsk)</option>
  <option value="GMT+08:00">UTC +08:00 (Hong Kong, Beijing, Singapore, Taipei)</option>
  <option value="GMT+09:00">UTC +09:00 (Tokyo, Osaka, Seoul, Yakutsk)</option>
  <option value="GMT+10:00">UTC +10:00 (Sydney, Guam, Melbourne, Brisbane, Hobart)</option>
  <option value="GMT+11:00">UTC +11:00 (Solomon Is., New Caledonia, Magadan)</option>
  <option value="GMT+12:00">UTC +12:00 (Fiji, Marshall Is., Kamchatka)</option>
  <option value="GMT+13:00">UTC +13:00 (Nuku'alofa)</option>
</select>
              </td>
            </tr>
            <tr style="border-bottom:1px solid #aaa;">
              <th></th>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <th></th>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <th>eBay accounts</th>
              <td>
                <table id="setting_ebay_accounts">
                </table>
                
                <button class="addebayaccount">
                  <s:text name="AddeBayAccount"/>
                </button>
              </td>
            </tr>
            <tr style="border-bottom:1px solid #aaa;">
              <th></th>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <th></th>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <th>Sync items from eBay</th>
              <td>
                <div id="syncitemsform">
                  eBay User ID <select name="userid"></select><br/>
                  Items which
                  <select name="daterange">
                    <option value="Start">start</option>
                    <option value="End" selected="selected">end</option>
                  </select>
                  between
                  <input type="text" name="datestart" value="" />
                  and
                  <input type="text" name="dateend" value="" />
                  (Max: 120 days)
                  <br/>
                  <button id="syncbutton">Sync items from eBay</button>
                </div>
              </td>
            </tr>
            <tr style="border-bottom:1px solid #aaa;">
              <th></th>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <th>Import items from CSV</th>
              <td>
                <form method="post" action="/file/csvupload" id="csvform"
                      target="posttarget" enctype="multipart/form-data">
                  
                  You can import items from<br/>
                  Turbo Lister &quot;File Exchange Format(CSV file)&quot;<br/>
                  <img src="/img/turbolistercsvexport.png" />
                  <br/>
                  <br/>
                  Import to
                  <select name="userid"></select>
                  <br/>
                  CSV file<input type="file" id="csvfile" name="fileUpload" />
                  
                  <button>
                    <s:text name="Import"/>
                  </button>
                </form>
                <div id="csvimportmessage"></div>
              </td>
            </tr>
            <tr style="border-bottom:1px solid #aaa;">
              <th></th>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <th></th>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <th>Etsy accounts</th>
              <td>
                <table id="setting_etsy_accounts">
                </table>
                
                <button class="addetsyaccount">
                  <s:text name="AddEtsyAccount"/>
                </button>
                
                <input type="text" id="etsy_verification_code" size="10" />
                <button class="send-etsy-verification-code">
                  <s:text name="Send"/>
                </button>
                
              </td>
            </tr>
            <tr style="border-bottom:1px solid #aaa;">
              <th></th>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <th></th>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <th>Cancel account</th>
              <td>
                <a id="cancelaccountlink" href="/page/cancelaccount">Cancel account</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div><!-- #settings -->
      
      <div id="help">
        
        <s:if test="#request.locale.language=='ja'">
          まだListersInにeBayアカウントを追加されていない場合は、以下の説明をお読みください。<br/>
          <br/>
          
          <span style="font-weight:bold;">eBayアカウントの追加方法</span><br/>
          <ol>
            <li>
              「<s:text name="AddeBayAccount"/>」ボタンをクリックしてください。
              <button class="addebayaccount">
                <s:text name="AddeBayAccount"/>
              </button>
            </li>
            <li>
              eBayのログイン画面にジャンプしますので、
              ListersInに追加したいeBayアカウントでログインしてください。<br />
            </li>
            <li>
              「I agree」ボタンをクリックしてください。<br/>
            </li>
            <li>
              自動的にListersInの画面に戻ります。<br />
              ListersInの画面の左側に、追加したeBayアカウントが表示されます。<br/>
            </li>
          </ol>
          
          何かご不明な点がございましたら、
          <a href="mailto:support@listers.in">support@listers.in</a>
          までメールでご質問ください。<br/>
          
          または
          <a href="http://forum.listers.in/" target="_blank">このフォーラム</a>
          にコメントを投稿してください。(フォーラムにログインしなくても匿名で投稿できます)<br/>
        </s:if>
        
        <s:else>
          If you don't add eBay account to ListersIn yet, please read following instruction.<br/>
          <br/>
          
          <div style="font-weight:bold; margin-top:10px; font-size:110%;">
            <img src="/icon/01/16/44.png"/>
            How to import your existing items from eBay to ListersIn
          </div>
          <ol>
            <li>
              Click &quot;<s:text name="AddeBayAccount"/>&quot; button.
              <button class="addebayaccount">
                <s:text name="AddeBayAccount"/>
              </button>
            </li>
            <li>
              You will be redirected to eBay sign in page.<br/>
              Please sign in to eBay with the account which you want to add to ListersIn.<br/>
              <div style="color:red;">
                You don't give your eBay user id and password to ListersIn.<br/>
                You just allow ListersIn to access eBay data via its API.
              </div>
            </li>
            <li>
              Click &quot;I agree&quot; button.<br/>
            </li>
            <li>
              You will be back to ListersIn site, and the eBay account will be shown at left side.
            </li>
            <li>
              Your existing items will be imported from eBay automatically.
            </li>
          </ol>
          
          <div style="font-weight:bold; margin-top:10px; font-size:110%;">
            <img src="/icon/01/16/44.png"/>
            How to prepare a new item and list to eBay
          </div>
          <ol>
            <li>
              Click &quot;Add New Item&quot; button on left navigation.
              (below the ListersIn logo)
            </li>
            <li>
              Fill out the item forms with information which you want to sell on eBay.
            </li>
            <li>
              Click &quot;Save&quot; button to save the item data to ListersIn.
            </li>
            <li>
              You can see the saved items by clicking &quot;Saved&quot; on left navigation.
            </li>
            <li>
              Check the item which you want to list to eBay.
              (Checkbox at left of each item's title)
            </li>
            <li>
              Click &quot;List&quot; button on top of the page.
            </li>
          </ol>
          
          <div style="font-weight:bold; margin-top:10px; font-size:110%;">
            <img src="/icon/01/16/44.png"/>
            How to relist an unsold item again
          </div>
          <ol>
            <li>
              Click &quot;Unsold&quot; on left navigation.
            </li>
            <li>
              Check the item which you want to relist to eBay again.
              (Checkbox at left of each item's title)
            </li>
            <li>
              Click &quot;Relist&quot; button on top of the page.
            </li>
          </ol>
          
          If you have any problems, please send an email to
          <a href="mailto:support@listers.in">support@listers.in</a> :)<br/>
          Or please post your comment to
          <a href="http://forum.listers.in/" target="_blank">this forum</a>.
          (You can post without forum account)<br/>
        </s:else>
        
      </div><!-- #help -->
      
      <div id="debug"></div>
      
    </div><!-- #content -->
    
  </div><!-- rightpane -->
  
  
  <div style="clear:both;"></div>

<div id="detailtemplate">
<div class="detail">
  
  <ul class="tabNav">
    <li class="current"><s:text name="Setting"/></li>
    <li><s:text name="CategoryAndTitle"/></li>
    <li><s:text name="Pictures"/></li>
    <li><s:text name="Description"/></li>
    <li><s:text name="Price"/></li>
    <li><s:text name="Payment"/></li>
    <li><s:text name="Shipping"/></li>
    <li><s:text name="Other"/></li>
    <li><s:text name="All"/></li>
  </ul>
  
  <div class="editbuttons">
    <button class="edit"><s:text name="Edit"/></button>
    <button class="save btnleft" style="display:none;"><s:text name="Save"/></button>
    <button class="cancel btnright" style="display:none;"><s:text name="Cancel"/></button>
  </div>
  
  <div class="tabContainer">
    
    <div class="tab current">
      <div class="tabtitle">
        Settings for this item
      </div>
      <table class="detail">
        <tbody>
          <tr>
            <th><s:text name="UserID"/></th>
            <td><select name="UserID"></select></td>
          </tr>
          <tr>
            <th><s:text name="Site"/></th>
            <td><select name="mod.Site"></select></td>
          </tr>
          <tr>
            <th><s:text name="Currency"/></th>
            <td><select name="mod.Currency"></select></td>
          </tr>
          <tr>
            <th><s:text name="AutoRelist"/></th>
            <td>
              <select name="opt.AutoRelist">
                <option value="false">OFF</option>
                <option value="true">ON</option>
              </select>
              
              <br/>
              
              <input type="checkbox" value="true"
                     name="opt.AutoRelistAddBestOffer"
                      id="_id.opt.AutoRelistAddBestOffer" />
              <label for="_id.opt.AutoRelistAddBestOffer">
                Enable best offer option when auto relist.
              </label>
            </td>
          </tr>
        </tbody>
      </table>
    </div><!-- tab -->
    
    <div class="tab">
      <div class="tabtitle">
        <s:if test="#request.locale.language=='ja'">
          出品するカテゴリ
        </s:if>
        <s:elseif test="#request.locale.language=='de'">
          Kategorien, in denen Ihr Angebot erscheint
        </s:elseif>
        <s:else>
          Categories where your listing will appear
        </s:else>
      </div>
      <table class="detail">
        <tbody>
          <tr>
            <th><s:text name="PrimaryCategory"/></th>
            <td class="primarycategory">
              <select class="primarycategory" name="mod.PrimaryCategory.CategoryID"></select>
            </td>
          </tr>
          <tr>
            <th><s:text name="SecondaryCategory"/></th>
            <td class="secondarycategory">
              <select class="secondarycategory" name="mod.SecondaryCategory.CategoryID"></select>
            </td>
          </tr>
          <tr>
            <th><s:text name="ProductDetails"/></th>
            <td>
              
              <div class="productsearchform">
                
                <span class="CharacteristicsSetsName"></span>
                <input name="ProductSearch.QueryKeywords" type="text" size="30" class="remove"/>
                <button class="GetProductSearchResults"><s:text name="Search"/></button>
                <div class="productsearchmessage"></div>
                <input name="ProductSearch.CharacteristicSetIDs.ID" type="hidden" class="remove"/>
                
                <br/>
                <div style="clear:both;"></div>
                
                <div class="foundproducts">
                  <div class="close">
                    <button><s:text name="Close"/></button>
                  </div>
                  <div class="header"><s:text name="Categories"/></div>
                  <ul class="suggestedcategories">
                    <li class="suggestedcategory-template">
                      <input type="radio" name="CategoryID">
                      <label></label>
                    </li>
                  </ul>
                  <div class="header"><s:text name="Products"/></div>
                  <ul class="product-list clearfix">
                    <li class="product-template clearfix">
                      <div class="product-stockphoto">
                        <img src=""/>
                      </div>
                      <div class="product-text">
                        <div class="product-title"></div>
                        <a href="#" class="product-select">Select</a>
                        <a href="#" class="product-detail" target="_blank">Detail</a>
                      </div>
                    </li>
                  </ul>
                </div><!-- .foundproducts -->
                
                <div class="productlistingdetails">
                  
                  <input name="mod.ProductListingDetails.ProductID"
                         type="text" size="15" placeholder="Product ID"/>
                  <input name="mod.ProductListingDetails.ProductReferenceID"
                         type="text" size="15" placeholder="Product Reference ID"/>
                  <br/>
                  <br/>
                  
                  <input type="checkbox" value="true"
                         name="mod.ProductListingDetails.IncludePrefilledItemInformation"
                         id="_id.ProductListingDetails.IncludePrefilledItemInformation"/>
                  <label  for="_id.ProductListingDetails.IncludePrefilledItemInformation">
                    Include the following product information in your listing
                  </label>
                  
                  <br/>
                  
                  <input type="checkbox" value="true"
                         name="mod.ProductListingDetails.IncludeStockPhotoURL"
                         id="_id.ProductListingDetails.IncludeStockPhotoURL"/>
                  <label  for="_id.ProductListingDetails.IncludeStockPhotoURL">
                    Include Stock Photo
                  </label>
                  
                  <br/>
                  
                  <input type="checkbox" value="true"
                         name="mod.ProductListingDetails.UseStockPhotoURLAsGallery"
                         id="_id.ProductListingDetails.UseStockPhotoURLAsGallery"/>
                  <label  for="_id.ProductListingDetails.UseStockPhotoURLAsGallery">
                    Use Stock Photo As Gallery
                  </label>
                  
                </div><!-- .productlistingdetails -->
                  
              </div><!-- .productsearchform -->
              
            </td>
          </tr>
        </tbody>
      </table><!-- .detail -->
      
      <div class="tabtitle">
        <s:if test="#request.locale.language=='ja'">
          この商品を複数のバリエーションで出品する
        </s:if>
        <s:elseif test="#request.locale.language=='de'">
          List multiple variations of this item in one listing
        </s:elseif>
        <s:else>
          List multiple variations of this item in one listing
        </s:else>
      </div>
      
      <div class="variations-enabled">
        
        <div class="variationaddforms">
          <div>
            <s:text name="AddVariationDetail" />
          </div>
          <div>
            <ul class="VariationSpecificsSet clearfix">
            </ul>
          </div>
          <div>
            <input type="text" id="addowndetail" class="inputleft" 
                   placeholder="<s:text name="AddYourOwnDetail" />" />
            <button class="addownbutton btnright"><s:text name="Add" /></button>
          </div>
        </div>
        
        <div class="variationstablewrapper">
          <table class="Variations">
            <thead>
              <tr>
                <th><s:text name="CustomLabel" /></th>
                <th><s:text name="Price" /></th>
                <th><s:text name="Quantity" /></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input type="text" name="mod.Variations.Variation.0.SKU" />
                </td>
                <td>
                  <input type="hidden" 
                         name="mod.Variations.Variation.0.StartPrice.@currencyID" />
                  <div class="currencyID"></div>
                  <input type="text"   name="mod.Variations.Variation.0.StartPrice.#text" />
                </td>
                <td>
                  <input type="text" name="mod.Variations.Variation.0.Quantity" />
                </td>
                <td>
                  <a href="#" class="removevariationrow">X</a>
                </td>
              </tr>
            </tbody>
          </table>
          <a href="#" class="addvariationrow"><s:text name="AddMoreVariation" /></a>
        </div>
        
        <div class="variationaddforms clearfix">
          <div>
            <s:text name="VariationSpecificPictureSet"/>
          </div>
          <div>
            <select name="mod.Variations.Pictures.VariationSpecificName">
              <option value="">(not selected)</option>
            </select>
          </div>
        </div><!-- .variationaddforms -->
        <div class="VariationSpecificPictureSet">
          <div class="VariationPictures0">
            <input type="hidden" name="mod.<s:text name="_VPVSPS"/>.0.VariationSpecificValue" />
            <form method="post" action="/file/upload" target="posttarget" 
                  enctype="multipart/form-data">
              <div class="variationspecificvalue"></div>
              Upload images from your computer
              <input type="file" name="multiplefile" multiple="multiple"/>
            </form>
            
            <form class="webimageform" method="post" action="/">
              Use self hosted images
              <input type="text" name="webimageurl" size="30"
                     placeholder="Input url of self hosted image" />
              <button class="webimageformbutton">UPLOAD</button>
            </form>
            
            <ul class="variationpictures clearfix">
              <li class="template">
                <div>
                  <img src="/img/noimage.jpg"/>
                </div>
                <a href="#" class="deletepicture"><a:text name="Delete"/></a>
              </li>
            </ul>
          </div>
        </div><!-- .VariationSpecificPictureSet -->
        
      </div><!-- .variations-enabled -->
      
      <div class="variations-disabled">
        Variations are disabled in selected category.
      </div>
      
      <div class="tabtitle">
        <s:if test="#request.locale.language=='ja'">
          タイトルと商品の仕様
        </s:if>
        <s:elseif test="#request.locale.language=='de'">
          Verfassen Sie eine aussagekräftige Artikelbezeichnung
        </s:elseif>
        <s:else>
          Help buyers find your item with a great title
        </s:else>
      </div>
      <table class="detail">
        <tbody>
          <tr>
            <th><s:text name="Title"/></th>
            <td>
              <input name="mod.Title" type="text" size="80"/>
              <span class="title-character-count"></span>
              <br/>
              <input type="checkbox" value="BoldTitle"
                     name="mod.ListingEnhancement"
                      id="_id.ListingEnhancement"/>
              <label for="_id.ListingEnhancement">
                Attract buyers' attention by making the title of your listing appear in Bold
              </label>
            </td>
          </tr>
          <tr>
            <th><s:text name="SubTitle"/></th>
            <td><input name="mod.SubTitle" type="text" size="60"/></td>
          </tr>
          <tr>
            <th><s:text name="Condition"/></th>
            <td><select name="mod.ConditionID"></select></td>
          </tr>
          <tr>
            <th><s:text name="ConditionDescription"/></th>
            <td>
              <textarea name="mod.ConditionDescription" cols="60" rows="3"></textarea>
            </td>
          </tr>
          <tr>
            <th><s:text name="ItemSpecifics"/></th>
            <td class="ItemSpecifics">
              <table class="ItemSpecifics">
              </table>
              <a href="#" class="addis">Add Item Specifics</a>
            </td>
          </tr>
        </tbody>
      </table><!-- .detail -->
    </div>
    
    <div class="tab">
      <div class="tabtitle">
        <s:if test="#request.locale.language=='ja'">
          商品に関連する写真
        </s:if>
        <s:elseif test="#request.locale.language=='de'">
          Gestalten Sie Ihr Angebot mit Bildern noch attraktiver.
        </s:elseif>
        <s:else>
          Bring your item to life with pictures
        </s:else>
      </div>
      <table class="detail">
        <tbody>
          <tr>
            <th><s:text name="Images" /></th>
            <td>
              <div class="pictures">
                
                <ul class="pictures clearfix">
                  <li class="template">
                    <div>
                      <img src="/img/noimage.jpg"/>
                    </div>
                    <a href="#" class="deletepicture"><s:text name="Delete"/></a>
                  </li>
                </ul>
                
                <form method="post" action="/file/upload"
                      target="posttarget" enctype="multipart/form-data">
                  Upload images from your computer
                  <input type="file" name="multiplefile" multiple="multiple"/>
                  You can select multiple files at once.
                </form>
                
                <form class="webimageform" method="post" action="/">
                  Use self hosted images
                  <input type="text" name="webimageurl" size="30" 
                         placeholder="Input url of self hosted image" />
                  <button class="webimageformbutton">UPLOAD</button>
                </form>
                
              </div>
            </td>
          </tr>
          <tr>
            <th>GalleryType</th>
            <td>
              <select name="mod.PictureDetails.GalleryType">
                <option value=""></option>
                <option value="Gallery">Gallery</option>
                <option value="Plus">Plus</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table><!-- .detail -->
    </div><!-- .tab -->
    
    <div class="tab">
      <div class="tabtitle">
        <s:if test="#request.locale.language=='ja'">
          商品の詳しい説明
        </s:if>
        <s:elseif test="#request.locale.language=='de'">
          Beschreiben Sie den Artikel, den Sie verkaufen möchten.
        </s:elseif>
        <s:else>
          Describe the item you're selling
        </s:else>
      </div>
      <div class="description">
        <textarea name="mod.Description" cols="100" rows="10"></textarea>
      </div>
      
      <table class="detail">
        <tbody>
          <tr>
            <td colspan="2">
              <s:text name="ListingDesigner"/>
            </td>
          </tr>
          <tr>
            <th><s:text name="SelectTheme"/></th>
            <td>
              <select name="ListingDesigner.GroupID">
                <option value=""></option>
              </select>
            </td>
          </tr>
          <tr>
            <th><s:text name="SelectDesign"/></th>
            <td>
              <select name="mod.ListingDesigner.ThemeID">
                <option value=""></option>
              </select>
            </td>
          </tr>
          <tr>
            <th><s:text name="HitCounter"/></th>
            <td>
              <select name="mod.HitCounter">
                <option value=""></option>
                <option value="BasicStyle">BasicStyle</option>
                <option value="GreenLED">GreenLED</option>
                <option value="Hidden">Hidden</option>
                <option value="HiddenStyle">HiddenStyle</option>
                <option value="HonestyStyle">HonestyStyle</option>
                <option value="NoHitCounter">NoHitCounter</option>
                <option value="RetroStyle">RetroStyle</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table><!-- .detail -->
    </div><!-- .tab -->
    
    <div class="tab">
      <div class="tabtitle">
        <s:if test="#request.locale.language=='ja'">
          オークションの期間や価格などの設定
        </s:if>
        <s:elseif test="#request.locale.language=='de'">
          Wählen Sie aus, wie Sie Ihren Artikel verkaufen möchten
        </s:elseif>
        <s:else>
          Choose how you'd like to sell your item
        </s:else>
      </div>
      <table class="detail">
        <tbody>
          <tr>
            <th><s:text name="ListingType"/></th>
            <td>
              <select name="mod.ListingType">
                <option value="Chinese">Online Auction</option>  
                <option value="FixedPriceItem">Fixed Price</option>
                <option value="StoresFixedPrice">Stores Fixed Price</option>
                <option value="LeadGeneration">Classified Ad</option>
              </select>
            </td>
          </tr>
          <tr>
            <th><s:text name="StartPrice"/></th>
            <td>
              <input name="mod.StartPrice.@currencyID"
                     type="text" size="3" class="aslabel">
              <input name="mod.StartPrice.#text" type="text" size="10">
            </td>
          </tr>
          <tr>
            <th><s:text name="BestOffer"/></th>
            <td>
              <input type="checkbox" value="true"
                     name="mod.BestOfferDetails.BestOfferEnabled"
                      id="_id.BestOfferDetails.BestOfferEnabled"/>
              <label for="_id.BestOfferDetails.BestOfferEnabled">
                Allow buyers to send you their Best Offers for your consideration
              </label>
            </td>
          </tr>
          <tr>
            <th><s:text name="BestOfferAutoAcceptPrice"/></th>
            <td>
              <input name="mod.ListingDetails.BestOfferAutoAcceptPrice.@currencyID"
                     type="text" size="3" class="aslabel"/>
              <input name="mod.ListingDetails.BestOfferAutoAcceptPrice.#text"
                     type="text" size="10"/>
            </td>
          </tr>
          <tr>
            <th><s:text name="MinimumBestOfferPrice"/></th>
            <td>
              <input name="mod.ListingDetails.MinimumBestOfferPrice.@currencyID"
                     type="text" size="3" class="aslabel"/>
              <input name="mod.ListingDetails.MinimumBestOfferPrice.#text"
                     type="text" size="10"/>
            </td>
          </tr>
          <tr>
            <th><s:text name="Quantity"/></th>
            <td><input name="mod.Quantity" type="text" size="5"/></td>
          </tr>
          <tr>
            <th><s:text name="LotSize"/></th>
            <td>
              <!-- todo: disable if CategoryArray.Category.LSD is true. -->
              <input name="mod.LotSize" type="text" size="5"/>
            </td>
          </tr>
          <tr>
            <th><s:text name="ListingDuration"/></th>
            <td>
              <select name="mod.ListingDuration"></select>
              
              <select name="opt.ScheduleType">
                <option value="">Start listing immediately</option>
                <option value="ebay">Schedule start time on eBay ($0.10)</option>
                <option value="listersin">Schedule start time on ListersIn (Free)</option>
              </select>
              
              <input type="text" name="mod.ScheduleTime" placeholder="Click here to use calendar"/>
              
            </td>
          </tr>
          <tr>
            <th><s:text name="PrivateListing"/></th>
            <td>
              <input type="checkbox" value="true"
                     name="mod.PrivateListing"
                      id="_id.PrivateListing"/>
              <label for="_id.PrivateListing">
                Allow buyers to remain anonymous to other eBay users
              </label>
            </td>
          </tr>
          <tr>
            <th><s:text name="BuyItNowPrice"/></th>
            <td>
              <input name="mod.BuyItNowPrice.@currencyID"
                     type="text" size="3" class="aslabel">
              <input name="mod.BuyItNowPrice.#text" type="text" size="10">
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="tab">
      <div class="tabtitle">
        <s:if test="#request.locale.language=='ja'">
          支払い方法
        </s:if>
        <s:elseif test="#request.locale.language=='de'">
          Entscheiden Sie, welche Zahlungsmethoden Sie akzeptieren
        </s:elseif>
        <s:else>
          Decide how you'd like to be paid
        </s:else>
      </div>
      <table class="detail">
        <tbody>
          <tr>
            <th><s:text name="PaymentMethods"/></th>
            <td class="paymentmethod">
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="tab">
      <div class="tabtitle">
        <s:if test="#request.locale.language=='ja'">
          発送方法
        </s:if>
        <s:elseif test="#request.locale.language=='de'">
          Teilen Sie Ihren Käufern die Versandinformationen mit.
        </s:elseif>
        <s:else>
          Give buyers shipping details
        </s:else>
      </div>
      <div class="shipping">
        <table class="detail">
          <tbody>
            <tr>
              <td colspan="2" class="tab_subtitle">
                <s:if test="#request.locale.language=='ja'">
                  国内発送
                </s:if>
                <s:elseif test="#request.locale.language=='de'">
                  Versand im Inland
                </s:elseif>
                <s:else>
                  Domestic shipping
                </s:else>
              </td>
            </tr>
            <tr>
              <th><s:text name="ShippingType"/></th>
              <td>
                <select name="mod.ShippingDetails.ShippingType.domestic">
                  <option value="Flat">Flat: same cost to all buyers</option>
                  <option value="Calculated">Calculated: Cost varies by buyer location</option>
                  <option value="FreightFlat">Freight: large items over 150 lbs.</option>
                  <option value="" selected="selected">No shipping: Local pickup only</option>
                </select>
              </td>
            </tr>
          </tbody>
          <tbody class="shippingmainrows">
            <tr class="packagetype">
              <th><s:text name="PackageType"/></th>
              <td>
                <select name="mod.<s:text name="_SDCSR"/>.ShippingPackage"></select>
                <input type="checkbox"
                       name="mod.<s:text name="_SDCSR"/>.ShippingIrregular"
                         id="_id.<s:text name="_SDCSR"/>.ShippingIrregular"/>
                <label  for="_id.<s:text name="_SDCSR"/>.ShippingIrregular">
                  Irregular package
                </label>
              </td>
            </tr>
            <tr class="dimensions">
        <th><s:text name="Dimensions"/></th>
        <td class="dimensions">
          <input  name="mod.<s:text name="_SDCSR"/>.PackageLength.#text"
              type="text" size="3">
          <input  name="mod.<s:text name="_SDCSR"/>.PackageLength.@unit"
              type="text" size="3">
          <select name="mod.<s:text name="_SDCSR"/>.PackageLength.@measurementSystem">
          <option value=""></option>
          <option value="English">English</option>
          <option value="Metric">Metric</option>
          </select>
          x
          <input  name="mod.<s:text name="_SDCSR"/>.PackageWidth.#text"
              type="text" size="3">
          <input  name="mod.<s:text name="_SDCSR"/>.PackageWidth.@unit"
              type="text" size="3">
          <select name="mod.<s:text name="_SDCSR"/>.PackageWidth.@measurementSystem">
          <option value=""></option>
          <option value="English">English</option>
          <option value="Metric">Metric</option>
          </select>
          x
          <input  name="mod.<s:text name="_SDCSR"/>.PackageDepth.#text"
              type="text" size="3">
          <input  name="mod.<s:text name="_SDCSR"/>.PackageDepth.@unit"
              type="text" size="3">
          <select name="mod.<s:text name="_SDCSR"/>.PackageDepth.@measurementSystem">
          <option value=""></option>
          <option value="English">English</option>
          <option value="Metric">Metric</option>
          </select>
        </td>
        </tr>
        <tr class="weight">
        <th><s:text name="Weight"/></th>
        <td class="weight">
          <input  name="mod.<s:text name="_SDCSR"/>.WeightMajor.#text"
              type="text" size="3">
          <input  name="mod.<s:text name="_SDCSR"/>.WeightMajor.@unit"
              type="text" size="3">
          <select name="mod.<s:text name="_SDCSR"/>.WeightMajor.@measurementSystem">
          <option value=""></option>
          <option value="English">English</option>
          <option value="Metric">Metric</option>
          </select>
          
          <input name="mod.<s:text name="_SDCSR"/>.WeightMinor.#text"
             type="text" size="3">
          <input name="mod.<s:text name="_SDCSR"/>.WeightMinor.@unit"
             type="text" size="3">
          <select name="mod.<s:text name="_SDCSR"/>.WeightMinor.@measurementSystem">
          <option value=""></option>
          <option value="English">English</option>
          <option value="Metric">Metric</option>
          </select>
        </td>
        </tr>
        <tr>
          <th><s:text name="Services"/></th>
          <td class="shippingservices">
            
            <div class="ShippingService0">
              
              <input name="mod.<s:text name="_SDSSO"/>.0.ShippingServicePriority"
                     type="text" size="1"/>
              
              <select name="mod.<s:text name="_SDSSO"/>.0.ShippingService"
                      class="ShippingService"></select>
              
              <input name="mod.<s:text name="_SDSSO"/>.0.ShippingServiceCost.@currencyID"
                     type="text" size="3" class="aslabel"/>
              
              <input name="mod.<s:text name="_SDSSO"/>.0.ShippingServiceCost.#text"
                     type="text" size="5" placeholder="Cost"/>
              
              <input value="true" type="checkbox"
                     name="mod.<s:text name="_SDSSO"/>.0.FreeShipping"
                     id="_id.<s:text name="_SDSSO"/>.0.FreeShipping"/>
              
              <label  for="_id.<s:text name="_SDSSO"/>.0.FreeShipping">
                Free shipping
              </label>
              
              <a href="#" class="removesso">Remove service</a>
              
            </div>
            
            <a href="#" class="addsso">Offer additional service</a>
            
          </td>
        </tr>
        <tr class="handlingtime">
          <th><s:text name="HandlingTime"/></th>
          <td><select name="mod.DispatchTimeMax"></select></td>
        </tr>
        <tr>
        <th><s:text name="Options"/></th>
        <td>
          <input type="checkbox" value="true" name="mod.GetItFast" id="_id.GetItFast"/>
          <label for="_id.GetItFast">
            GetItFast
          </label>
        </td>
        </tr>
        <tr>
          <td colspan="2" class="tab_subtitle">
            <s:if test="#request.locale.language=='ja'">
              海外発送
            </s:if>
            <s:elseif test="#request.locale.language=='de'">
              Internationaler Versand
            </s:elseif>
            <s:else>
              International shipping
            </s:else>
          </td>
        </tr>
        <tr>
          <th><s:text name="ShippingType"/></th>
          <td>
            <select name="mod.ShippingDetails.ShippingType.international">
              <option value="Flat">Flat: same cost to all buyers</option>
              <option value="Calculated">Calculated: Cost varies by buyer location</option>
              <option value="" selected="selected">No international shipping</option>
            </select>
          </td>
        </tr>
      </tbody>
      <tbody class="internationalshippingmainrows">
        <tr>
          <th><s:text name="Services"/></th>
          <td class="internationalshippingservices">
            
            <div class="ShippingService0 clearfix">
              <input name="mod.<s:text name="_SDISSO"/>.0.ShippingServicePriority" type="hidden" />
              <select name="mod.<s:text name="_SDISSO"/>.0.ShippingService"
                      class="ShippingService"></select>
              
              <s:text name="Cost"/>
              <input name="mod.<s:text name="_SDISSO"/>.0.ShippingServiceCost.@currencyID"
                     type="text" size="3" class="aslabel">
              <input name="mod.<s:text name="_SDISSO"/>.0.ShippingServiceCost.#text"
                     type="text" size="5">
              
              <a href="#" class="removesso">Remove service</a>
              <br />
              
              <s:text name="ShipTo"/><br />
              <ul class="ShipToLocation clearfix"></ul>
            </div>
            
            <a href="#" class="addsso">Offer additional service</a>
          </td>
        </tr>
        <tr>
          <th><s:text name="ShipToLocations" /></th>
          <td>
            <ul class="ShipToLocations clearfix">
            </ul>
          </td>
        </tr>
      </tbody>
      <tbody>
        <tr>
          <td colspan="2" class="tab_subtitle">
            Item location
          </td>
        </tr>
        <tr>
          <th><s:text name="Country"/></th>
          <td><select name="mod.Country"></select></td>
        </tr>
        <tr>
          <th><s:text name="PostalCode"/></th>
          <td>
            <input type="text" name="mod.PostalCode" size="10"/>
          </td>
        </tr>
        <tr>
          <th><s:text name="Location"/></th>
          <td>
            <input type="text" name="mod.Location" size="10"/>
          </td>
        </tr>
      </tbody>
      </table>
    </div>
    </div><!-- tab -->
    
    <div class="tab">
      <div class="tabtitle">
        <s:if test="#request.locale.language=='ja'">
          その他の情報
        </s:if>
        <s:elseif test="#request.locale.language=='de'">
          Weitere Informationen für Ihre Käufer
        </s:elseif>
        <s:else>
          Other things you'd like buyers to know
        </s:else>
      </div>
    <table class="detail">
      <tbody>
      <tr>
        <th><s:text name="BuyerRequirements"/></th>
        <td>
        <input type="checkbox" value="true"
               name="mod.BuyerRequirementDetails.LinkedPayPalAccount"
                 id="_id.BuyerRequirementDetails.LinkedPayPalAccount">
        <label  for="_id.BuyerRequirementDetails.LinkedPayPalAccount">
          Don't have a PayPal account
        </label>
        
        <br/>
        
        <input type="checkbox" value="true" class="remove"
               name="mod.BuyerRequirementDetails.MaximumUnpaidItemStrikesInfo.checkbox"
                 id="_id.BuyerRequirementDetails.MaximumUnpaidItemStrikesInfo.checkbox">
        <label  for="_id.BuyerRequirementDetails.MaximumUnpaidItemStrikesInfo.checkbox">
          Have received
        </label>
        <select name="mod.BuyerRequirementDetails.MaximumUnpaidItemStrikesInfo.Count">
          <option value=""></option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
        <label  for="_id.BuyerRequirementDetails.MaximumUnpaidItemStrikesInfo.checkbox">
          Unpaid item case(s) within
        </label>
        <select name="mod.BuyerRequirementDetails.MaximumUnpaidItemStrikesInfo.Period">
          <option value=""></option>
          <option value="Days_30">1</option>
          <option value="Days_180">6</option>
          <option value="Days_360">12</option>
        </select>
        <label for="_id.BuyerRequirementDetails.MaximumUnpaidItemStrikesInfo.checkbox">
          month(s)
        </label>
        
        <br/>
        
        <input type="checkbox" value="true"
               name="mod.BuyerRequirementDetails.ShipToRegistrationCountry"
                id="_id.BuyerRequirementDetails.ShipToRegistrationCountry"/>
        <label for="_id.BuyerRequirementDetails.ShipToRegistrationCountry">
          Have a primary shipping address in countries that I don't ship to
        </label>
        
        <br/>
        
        <input type="checkbox" value="true" class="remove"
               name="BuyerRequirementDetails.MaximumBuyerPolicyViolations.checkbox"
                id="_id.BuyerRequirementDetails.MaximumBuyerPolicyViolations.checkbox"/>
        <label for="_id.BuyerRequirementDetails.MaximumBuyerPolicyViolations.checkbox">
          Have
        </label>
        <select name="mod.BuyerRequirementDetails.MaximumBuyerPolicyViolations.Count">
          <option value=""></option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
          <option value="7">7</option>
        </select>
        <label for="_id.BuyerRequirementDetails.MaximumBuyerPolicyViolations.checkbox">
          Policy violation report(s) within
        </label>
        <select name="mod.BuyerRequirementDetails.MaximumBuyerPolicyViolations.Period">
          <option value=""></option>
          <option value="Days_30">1</option>
          <option value="Days_180">6</option>
        </select>
        <label for="_id.BuyerRequirementDetails.MaximumBuyerPolicyViolations.checkbox">
          month(s)
        </label>
        
        <br/>
        
        <input type="checkbox" value="true" class="remove"
               name="mod.BuyerRequirementDetails.MinimumFeedbackScore.checkbox"
                 id="_id.BuyerRequirementDetails.MinimumFeedbackScore.checkbox" />
        <label  for="_id.BuyerRequirementDetails.MinimumFeedbackScore.checkbox">
          Have a feedback score equal to or lower than
        </label>
        <select name="mod.BuyerRequirementDetails.MinimumFeedbackScore">
          <option value=""></option>
          <option value="-1">-1</option>
          <option value="-2">-2</option>
          <option value="-3">-3</option>
        </select>
        
        <br/>
        
        <input type="checkbox" value="true" class="remove"
               name="mod.BuyerRequirementDetails.MaximumItemRequirements.checkbox"
                 id="_id.BuyerRequirementDetails.MaximumItemRequirements.checkbox"/>
        <label  for="_id.BuyerRequirementDetails.MaximumItemRequirements.checkbox">
          Have bid on or bought my items within the last 10 days and met my limit of
        </label>
        <select name="mod.BuyerRequirementDetails.MaximumItemRequirements.MaximumItemCount">
          <option value=""></option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="75">75</option>
          <option value="100">100</option>
        </select>
        
        <br/>
        
        &nbsp;&nbsp;&nbsp;
        
  <input type="checkbox" value="true" class="remove"
         name="mod.BuyerRequirementDetails.MaximumItemRequirements.MinimumFeedbackScore.checkbox"
           id="_id.BuyerRequirementDetails.MaximumItemRequirements.MinimumFeedbackScore.checkbox"/>
  <label  for="_id.BuyerRequirementDetails.MaximumItemRequirements.MinimumFeedbackScore.checkbox">
    Only apply this block to buyers who have a feedback score equal to or lower than
  </label>
  <select name="mod.BuyerRequirementDetails.MaximumItemRequirements.MinimumFeedbackScore">
    <option value=""></option>
    <option value="5">5</option>
    <option value="4">4</option>
    <option value="3">3</option>
    <option value="2">2</option>
    <option value="1">1</option>
    <option value="0">0</option>
  </select>
  
  <br/>
  
        </td>
      </tr>
      <tr>
        <th><s:text name="SalesTax"/></th>
        <td>
          <select name="mod.SalesTax.ShippingIncludedInTax">
            <option value=""></option>
          </select>
          <input type="text" name="mod.SalesTax.SalesTaxPercent">%<br/>
          <input type="checkbox" value="true" name="mod.BuyerRequirementDetails.y"/>
          Also apply to shipping & handling costs
        </td>
      </tr>
      <tr>
        <th><s:text name="ReturnPolicy"/></th>
        <td>
          <select name="mod.ReturnPolicy.ReturnsAcceptedOption">
            <option value=""></option>
          </select>
          <br/>
          After receiving the item, your buyer should contact you within:
          <select name="mod.ReturnPolicy.ReturnsWithinOption">
            <option value=""></option>
          </select>
          <br/>
          
          Refund will be given as
          <select name="mod.ReturnPolicy.RefundOption">
            <option value=""></option>
          </select>
          <br/>
          
          Return shipping will be paid by
          <select name="mod.ReturnPolicy.ShippingCostPaidByOption">
            <option value=""></option>
          </select>
          <br/>
          
          Additional return policy details<br/>
          <textarea name="mod.ReturnPolicy.Description" cols="60" rows="3"></textarea>
          
        </td>
      </tr>
      <tr>
        <th><s:text name="AdditionalCheckoutInstructions"/></th>
        <td>
          <textarea name="mod.ShippingDetails.PaymentInstructions"
                    cols="60" rows="3"></textarea>
        </td>
      </tr>
      </tbody>
    </table>
    </div><!-- tab -->
    
  </div><!-- tabContainer -->
  
</div><!-- detail -->
  
</div><!-- detailtemplate -->

<div style="clear:both;"></div>

</div><!-- #container -->

<div id="membermessagetemplate" class="membermessage clearfix">
  <div class="question">
    <ul class="clearfix">
      <li class="status"></li>
      <li class="sender"></li>
      <li class="date"></li>
    </ul>
    <div class="body"></div>
  </div>
  <div class="form">
    <textarea name="body"></textarea>
    <button><s:text name="Respond"/></button>
  </div>
</div>

<script>
var hash;
hash = ${initjson.hash};

var mischash = ${initjson.mischash};

</script>

</body>
</html>
