
package com.ebay.soap.eBLBaseComponents;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAnyElement;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlType;
import org.w3c.dom.Element;


/**
 * 
 * 				Contains detailed information about a bid.
 * 			
 * 
 * <p>Java class for BiddingDetailsType complex type.
 * 
 * <p>The following schema fragment specifies the expected content contained within this class.
 * 
 * <pre>
 * &lt;complexType name="BiddingDetailsType">
 *   &lt;complexContent>
 *     &lt;restriction base="{http://www.w3.org/2001/XMLSchema}anyType">
 *       &lt;sequence>
 *         &lt;element name="ConvertedMaxBid" type="{urn:ebay:apis:eBLBaseComponents}AmountType" minOccurs="0"/>
 *         &lt;element name="MaxBid" type="{urn:ebay:apis:eBLBaseComponents}AmountType" minOccurs="0"/>
 *         &lt;element name="QuantityBid" type="{http://www.w3.org/2001/XMLSchema}int" minOccurs="0"/>
 *         &lt;element name="QuantityWon" type="{http://www.w3.org/2001/XMLSchema}int" minOccurs="0"/>
 *         &lt;element name="Winning" type="{http://www.w3.org/2001/XMLSchema}boolean" minOccurs="0"/>
 *         &lt;element name="BidAssistant" type="{http://www.w3.org/2001/XMLSchema}boolean" minOccurs="0"/>
 *         &lt;any/>
 *       &lt;/sequence>
 *     &lt;/restriction>
 *   &lt;/complexContent>
 * &lt;/complexType>
 * </pre>
 * 
 * 
 */
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "BiddingDetailsType", propOrder = {
    "convertedMaxBid",
    "maxBid",
    "quantityBid",
    "quantityWon",
    "winning",
    "bidAssistant",
    "any"
})
public class BiddingDetailsType
    implements Serializable
{

    private final static long serialVersionUID = 12343L;
    @XmlElement(name = "ConvertedMaxBid")
    protected AmountType convertedMaxBid;
    @XmlElement(name = "MaxBid")
    protected AmountType maxBid;
    @XmlElement(name = "QuantityBid")
    protected Integer quantityBid;
    @XmlElement(name = "QuantityWon")
    protected Integer quantityWon;
    @XmlElement(name = "Winning")
    protected Boolean winning;
    @XmlElement(name = "BidAssistant")
    protected Boolean bidAssistant;
    @XmlAnyElement(lax = true)
    protected List<Object> any;

    /**
     * Gets the value of the convertedMaxBid property.
     * 
     * @return
     *     possible object is
     *     {@link AmountType }
     *     
     */
    public AmountType getConvertedMaxBid() {
        return convertedMaxBid;
    }

    /**
     * Sets the value of the convertedMaxBid property.
     * 
     * @param value
     *     allowed object is
     *     {@link AmountType }
     *     
     */
    public void setConvertedMaxBid(AmountType value) {
        this.convertedMaxBid = value;
    }

    /**
     * Gets the value of the maxBid property.
     * 
     * @return
     *     possible object is
     *     {@link AmountType }
     *     
     */
    public AmountType getMaxBid() {
        return maxBid;
    }

    /**
     * Sets the value of the maxBid property.
     * 
     * @param value
     *     allowed object is
     *     {@link AmountType }
     *     
     */
    public void setMaxBid(AmountType value) {
        this.maxBid = value;
    }

    /**
     * Gets the value of the quantityBid property.
     * 
     * @return
     *     possible object is
     *     {@link Integer }
     *     
     */
    public Integer getQuantityBid() {
        return quantityBid;
    }

    /**
     * Sets the value of the quantityBid property.
     * 
     * @param value
     *     allowed object is
     *     {@link Integer }
     *     
     */
    public void setQuantityBid(Integer value) {
        this.quantityBid = value;
    }

    /**
     * Gets the value of the quantityWon property.
     * 
     * @return
     *     possible object is
     *     {@link Integer }
     *     
     */
    public Integer getQuantityWon() {
        return quantityWon;
    }

    /**
     * Sets the value of the quantityWon property.
     * 
     * @param value
     *     allowed object is
     *     {@link Integer }
     *     
     */
    public void setQuantityWon(Integer value) {
        this.quantityWon = value;
    }

    /**
     * Gets the value of the winning property.
     * 
     * @return
     *     possible object is
     *     {@link Boolean }
     *     
     */
    public Boolean isWinning() {
        return winning;
    }

    /**
     * Sets the value of the winning property.
     * 
     * @param value
     *     allowed object is
     *     {@link Boolean }
     *     
     */
    public void setWinning(Boolean value) {
        this.winning = value;
    }

    /**
     * Gets the value of the bidAssistant property.
     * 
     * @return
     *     possible object is
     *     {@link Boolean }
     *     
     */
    public Boolean isBidAssistant() {
        return bidAssistant;
    }

    /**
     * Sets the value of the bidAssistant property.
     * 
     * @param value
     *     allowed object is
     *     {@link Boolean }
     *     
     */
    public void setBidAssistant(Boolean value) {
        this.bidAssistant = value;
    }

    /**
     * 
     * 
     * @return
     *     array of
     *     {@link Element }
     *     {@link Object }
     *     
     */
    public Object[] getAny() {
        if (this.any == null) {
            return new Object[ 0 ] ;
        }
        return ((Object[]) this.any.toArray(new Object[this.any.size()] ));
    }

    /**
     * 
     * 
     * @return
     *     one of
     *     {@link Element }
     *     {@link Object }
     *     
     */
    public Object getAny(int idx) {
        if (this.any == null) {
            throw new IndexOutOfBoundsException();
        }
        return this.any.get(idx);
    }

    public int getAnyLength() {
        if (this.any == null) {
            return  0;
        }
        return this.any.size();
    }

    /**
     * 
     * 
     * @param values
     *     allowed objects are
     *     {@link Element }
     *     {@link Object }
     *     
     */
    public void setAny(Object[] values) {
        this._getAny().clear();
        int len = values.length;
        for (int i = 0; (i<len); i ++) {
            this.any.add(values[i]);
        }
    }

    protected List<Object> _getAny() {
        if (any == null) {
            any = new ArrayList<Object>();
        }
        return any;
    }

    /**
     * 
     * 
     * @param value
     *     allowed object is
     *     {@link Element }
     *     {@link Object }
     *     
     */
    public Object setAny(int idx, Object value) {
        return this.any.set(idx, value);
    }

}
