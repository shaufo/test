function FindProxyForURL(url, host) {
    // 日志函数，帮助调试
    function log(message) {
        // 实际环境中日志不会输出，仅用于调试说明
        console.log("[PAC DEBUG] " + message);
    }

    // 检查IP地址是否在特定网段
    function isInNet(ip, net, mask) {
        const ipNum = dnsResolve(ip);
        const netNum = dnsResolve(net);
        const maskNum = dnsResolve(mask);
        
        if (!ipNum || !netNum || !maskNum) {
            return false;
        }
        
        return (ipNum & maskNum) === (netNum & maskNum);
    }

    // 仅对 localhost 和 127.0.0.0/8 直接连接
    if (
        shExpMatch(host, "localhost") ||
        isInNet(host, "127.0.0.1", "255.0.0.0")
    ) {
        log("直接连接: " + host);
        return "DIRECT";
    }

    // 可选：添加更多直接连接规则
    // if (isInNet(host, "192.168.1.0", "255.255.255.0")) {
    //     log("局域网IP，直接连接: " + host);
    //     return "DIRECT";
    // }

    // 对所有其他域名和IP使用代理链
    log("使用代理: " + host);
    return "PROXY 192.168.1.2:7980; PROXY 192.168.1.6:7980";
}    
