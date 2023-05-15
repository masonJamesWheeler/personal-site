<script lang="ts">

</script>
<body class = "font-serif">
<div class="article-content w-screen h-full text-center lg:mt-36 md:mt24 mt-24">
    <h2 class="lg:text-4xl md:text-2xl text-xl underline">Charting Stocks in Different Programming Languages</h2>
    <!-- Badges for the skills using img.tags -->
    <div class="flex flex-row justify-center my-6">
        <img class="tags" src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
        <img class="tags" src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt = "Javascript"/>
        <img class="tags" src="https://img.shields.io/badge/C%2B%2B-00599C?style=for-the-badge&logo=c%2B%2B&logoColor=white" alt = "C++"/>
        <img class="tags" src="https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=java&logoColor=white" alt = "Java"/>
        <img class="tags" src="https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white" alt = "Rust"/>
    </div>
</div>
<div class="divider"></div>

<div>
    <h3 class = "text-xl font-semibold text-center">1. Python</h3>
    <!-- Description of the overview of the difficulty -->
    <h4 class = "md:text-lg text-md mx-8 my-4">Python's use in data-science and it's wide array of built in and third party libraries make it by far the easiest library to create your own
        charts, indicators, and backtesting algorithms. The only downside is that it is not as fast as other languages, but for the purposes of most projects it is more than
        fast enough.
    </h4>
<!-- Steps -->
<div class = "mx-8 text-md">
    <h3>Dependencies</h3>
    <div class="mockup-code h-full">
        <pre data-prefix="$"><code>pip install yfinance matplotlib numpy datetime</code></pre>
    </div>
    <h3>Code</h3>
    <div class="mockup-code h-full">
    <pre><code>import yfinance as yf
  import matplotlib.pyplot as plt
  from datetime import datetime, timedelta
    
  current_date = datetime(2020, 1, 1)
  # By adding a day we get around yFinance updating their most recent data at midnight
  end_date = datetime.now() + timedelta(days=1)

  ticker = "AAPL"
  apple = yf.download(ticker, start=current_date, end=end_date)
  # Data is in the form [Open, High, Low, Close, Adj Close, Volume] for each day

  # If we wanted to create a SMA of a n amount of days we could do so by adding a column to the dataframe
  apple['SMA_100'] = apple['Close'].rolling(window=100).mean()

  # Adjust the plotting settings to be more aesthetically pleasing
  plt.style.use('ggplot')

  # Plot the closing price of Apple
  plt.figure(figsize=(12, 6), dpi=100)
  plt.plot(apple['Close'])
  plt.plot(apple['SMA_100'], label='SMA 100')
  plt.title('Apple Stock Price')
  plt.xlabel('Days')
  plt.ylabel('Price')
  plt.show()
</code>
</pre>
</div>

<h3 class="text-xl font-semibold text-center">2. JavaScript</h3>
<!-- Description of the overview of the difficulty -->
<h4 class="md:text-lg text-md mx-8 my-4">
  JavaScript is a versatile language that can be used for charting stocks with the help of external libraries. While it may not be as specialized for data manipulation as Python, it still provides a good solution for creating stock charts in web applications.
</h4>
<!-- Steps -->
<div class="mx-8 text-md">
  <h3>Dependencies</h3>
  <div class="mockup-code h-full">
    <pre data-prefix="$"><code>npm install node-fetch plotly.js-dist</code></pre>
  </div>
  <h3>Code</h3>
  <div class="mockup-code h-full">
    <pre><code>const fetch = require('node-fetch');
  const Plotly = require('plotly.js-dist'); 
  async function chart_stock(stock_symbol, start_date, end_date) {'{'}
  const API_KEY = "your_api_key_here";
  const url = \`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&amp;symbol=${'stock_symbol'}&amp;apikey=${'API_KEY'}\`;
  
  const response = await fetch(url);
  const data = await response.json();
  const timeSeries = data["Time Series (Daily)"];
  
  const dates = [];
  const prices = [];
  
  for (const date in timeSeries) {'{'}
    if (date {'>='} start_date && date {'<='} end_date) {'{'}
      dates.push(date);
      prices.push(parseFloat(timeSeries[date]["4. close"]));
      {'}'}
    {'}'}
  
  const chartData = [
    {'{'}
      x: dates,
      y: prices,
      type: "scatter",
      mode: "lines",
      line: {'{'} color: "blue" {'}'},
      {'}'},
  ];
  
  const layout = {'{'}
    title: `${'stock_symbol'} Stock Price`,
    xaxis: {'{'} title: "Date" {'}'},
    yaxis: {'{'} title: "Price" {'}'},
    {'}'};
  
  Plotly.newPlot("chart-container", chartData, layout);
  {'}'}

  chart_stock("AAPL", "2021-01-01", "2021-12-31");
</code></pre>
  </div>
</div>
<h3 class="text-xl font-semibold text-center">3. C++</h3>
<!-- Description of the overview of the difficulty -->
<h4 class="md:text-lg text-md mx-8 my-4">
  C++ is a powerful and fast language, but using it for charting stocks can be more complex due to the limited availability of libraries and the need for manual memory management. Despite the challenges, C++ can be a good option for high-performance applications.
</h4>
<!-- Steps -->
<div class="mx-8 text-md">
  <h3>Dependencies</h3>
  <p>Install libcurl development library, and matplotlib-cpp header-only library:</p>
  <div class="mockup-code h-full">
    <pre data-prefix="$"><code>sudo apt-get install libcurl4-openssl-dev
wget https://github.com/lava/matplotlib-cpp/archive/refs/tags/v1.1.0.tar.gz
tar -xzvf v1.1.0.tar.gz
cp matplotlib-cpp-1.1.0/matplotlibcpp.h /usr/local/include/</code></pre>
  </div>
  <h3>Code</h3>
  <div class="mockup-code h-full">
    <pre><code>#include &lt;iostream&gt;
#include &lt;string&gt;
#include &lt;vector&gt;
#include &lt;curl/curl.h&gt;
#include "matplotlibcpp.h"

namespace plt = matplotlibcpp;

size_t WriteCallback(void *contents, size_t size, size_t nmemb, void *userp) {'{'}
    ((std::string *)userp)-&gt;append((char *)contents, size * nmemb);
    return size * nmemb;
{'}'}

std::string fetch_stock_data(const std::string &amp;stock_symbol, const std::string &amp;start_date, const std::string &amp;end_date) {'{'}
    CURL *curl;
    CURLcode res;
    std::string readBuffer;

    curl = curl_easy_init();
    if (curl) {'{'}
        std::string url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&amp;symbol=" + stock_symbol + "&amp;apikey=your_api_key_here";
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &amp;readBuffer);
        res = curl_easy_perform(curl);
        curl_easy_cleanup(curl);

        // Parse the stock data from readBuffer and create vectors for dates and prices
        // ...
    {'}'}

    return readBuffer;
{'}'}

void chart_stock(const std::string &amp;stock_symbol, const std::string &amp;start_date, const std::string &amp;end_date) {'{'}
    std::string stock_data = fetch_stock_data(stock_symbol, start_date, end_date);

    // Prepare data for the chart using the parsed stock data
    std::vector&lt;double&gt; dates;
    std::vector&lt;double&gt; prices;

    // ... (populate dates and prices vectors)

    plt::plot(dates, prices, "b-");
    plt::title(stock_symbol + " Stock Price");
    plt::xlabel("Date");
    plt::ylabel("Price");
    plt::show();
    {'}'}

int main() {'{'}
    chart_stock("AAPL", "2021-01-01", "2021-12-31");
    return 0;
{'}'}
</code></pre>
  </div>
</div>
 

</div>
</body>