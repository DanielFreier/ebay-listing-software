/* Each Users */
db.users.find().forEach(
  
  function(row) {
    
    if (row.email != 'Maxclinder@aol.com') return;
    //if (row.email != 'fd3s.boost@gmail.com') return;
    //if (row.email != 'demo@listers.in') return;
    
    var _id = row._id;
    _id = _id.toString();
    _id = _id.replace('"', '');
    _id = _id.replace('"', '');
    _id = _id.replace('ObjectId(', '');
    _id = _id.replace(')', '');
    //print(_id);
    
    db.getCollection('items.' + _id).update(
      {
        _id: ObjectId("52d80b9ceb62219b2200000a")
      },
      {
        $set: {


	"UserID" : "butchcasually",
	"mod" : {
		"Site" : "UK",
		"Currency" : "GBP",
		"PrimaryCategory" : {
			"CategoryID" : 38053
		},
		"Title" : "Un opened tin, Players Navy Cut",
		"ListingEnhancement" : "BoldTitle",
		"ConditionID" : 1000,
		"ConditionDescription" : "It is in excellent condition for its age - no tears in the paper which goes all the way around the tin, and it only has very minor blemishes.  Please see photos.\n\nIt measures 8cm in height and 7cm in diameter approx.\n\nPlease be warned that there is no health risk warning. ",
		"ItemSpecifics" : {
			"NameValueList" : [
				{
					"Name" : "Brand",
					"Value" : "Players"
				}
			]
		},
		"PictureDetails" : {
			"PictureURL" : [
				"http://i.ebayimg.com/00/s/MTIwMFgxNjAw/z/0ZoAAOxyOlhS2Amm/$_1.JPG?set_id=8800005007",
				"http://i.ebayimg.com/00/s/MTIwMFgxNjAw/z/VIEAAMXQlgtS2Amu/$_1.JPG?set_id=8800005007",
				"http://i.ebayimg.com/00/s/MTIwMFgxNjAw/z/h9UAAOxyVLNS2Am0/$_1.JPG?set_id=8800005007",
				"http://i.ebayimg.com/00/s/MTIwMFgxNjAw/z/~fIAAOxyUrZS2Am7/$_1.JPG?set_id=8800005007",
			]
		},
		"Description" : "<h1 style=\"text-align: center;\">This auction is for a John Player's Navy Cut Cigarette tin. </h1><h3 style=\"text-align: center;\">THE TIN IS UNOPENED SO CONDITION OF CONTENTS CANNOT BE VERIFIED</h3><h2 style=\"text-align: center;\">This tin must be rare in this unopened condition</h2><h4 style=\"text-align: center;\">&nbsp;It is \nin excellent condition for its age - no tears in the paper which goes \nall the way around the tin, and it only has very minor blemishes.</h4><h4 style=\"text-align: center;\">&nbsp;Please see photos for condition.</h4><p><em><strong>The buyer must be at least 18 years old. (As the seller, I'm responsible for making sure this rule is met.)</strong></em></p><h4 style=\"text-align: center;\">It measures 8cm in height and 7cm in diameter approx.</h4><h4 style=\"text-align: center;\">&nbsp;Please be warned that there is no health risk warning&nbsp;</h4><h4 style=\"text-align: center;\">&nbsp;UK bidders only.</h4><h4 style=\"text-align: center;\">99p start.</h4><h4 style=\"text-align: center;\">Any questions 07808853685</h4><p style=\"text-align: center;\">Postage £2.50</p><p style=\"text-align: center;\">See Ebays policy below</p><table><tbody><tr><td><strong><img src=\"http://pics.ebaystatic.com/aw/pics/icons/iconAllowed_25x25.gif\" alt=\"Allowed\" title=\"Allowed\" border=\"0\"></strong><p><strong>Allowed</strong></p></td><td><ul><li>Collectible\n packaging that contains tobacco can be listed as long as the package is\n completely sealed, and you follow and include all of the statements in \nthe list below in your listing. We recommend copying and pasting this \ndisclaimer directly into your item description.</li></ul>\n</td></tr><tr>\n<td><strong><img src=\"http://pics.ebaystatic.com/aw/pics/icons/iconRestricted_25x25.gif\" alt=\"Restricted\" title=\"Restricted\" border=\"0\"></strong><p><strong>Restricted</strong></p></td><td>\n<ul><li>The value of the item is the collectible packaging, not the tobacco itself.</li><li>Even though the package has never been opened, the tobacco inside is not for consumption.</li><li>The collectible packaging is not currently available in stores. </li><li>The buyer must be at least 18 years old. (As the seller, I'm responsible for making sure this rule is met.)</li><li>Both the buyer and the seller are following all applicable laws and shipping regulations for this transaction.</li><li>If you include photos in your listing, you have to show the actual item for sale, stock photos are not allowed.</li></ul></td></tr></tbody></table>",
		"HitCounter" : "RetroStyle",
		"ListingType" : "Chinese",
		"StartPrice" : {
			"@currencyID" : "GBP",
			"#text" : 0.99
		},
		"Quantity" : 1,
		"ListingDuration" : "Days_7",
		"PaymentMethods" : "PayPal",
		"ShippingDetails" : {
			"ShippingType" : "Flat,FlatDomesticFlatInternational",
			"ShippingServiceOptions" : [
				{
					"ShippingServicePriority" : 1,
					"ShippingService" : "UK_RoyalMailFirstClassStandard",
					"ShippingServiceCost" : {
						"@currencyID" : "GBP",
						"#text" : 2.5
					}
				}
			]
		},
		"DispatchTimeMax" : "1",
		"Country" : "GB",
		"PostalCode" : "WV166TX",
		"ReturnPolicy" : {
			"ReturnsAcceptedOption" : "ReturnsAccepted",
			"ReturnsWithinOption" : "Days_14",
			"ShippingCostPaidByOption" : "Buyer",
		}
	},
	"opt" : {
		"AutoRelist" : "false"
	},


          
        }
      }
    );
    
  }
);
